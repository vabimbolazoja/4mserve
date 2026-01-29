import https from 'https'
import Orders from '../models/orders.js'
import Payment from '../models/payment.js'
import Product from '../models/products.js'

/* =========================
   INITIATE PAYMENT
========================= */
export const initiatePayment = async (req, res) => {
  try {
    const {
      deliveryInfo,
      orders,
      user_email,
      user_id,
      totalAmt,
      paymentType,
      deliveryCost,
      totalSub,
    } = req.body

    if (!deliveryInfo || !orders?.length || !user_email || !user_id || !totalAmt) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const orderRef = `ORD-4MT-${Math.floor(100000 + Math.random() * 900000)}`
    const paymentRef = `PMT-4MT-${Math.floor(100000 + Math.random() * 900000)}`

    const order = new Orders({
      deliveryInfo,
      orders,
      userEmail: user_email,
      userId: user_id,
      totalAmt,
      paymentType,
      deliveryCost,
      totalSub,
      ref: orderRef,
    })

    const payment = new Payment({
      amount: totalAmt,
      userId: user_id,
      paymentType,
      orderId: order._id,
      paymentRef,
    })

    await order.save()
    await payment.save()

    const params = JSON.stringify({
      email: user_email,
      amount: Math.round(totalAmt * 100),
      currency: 'NGN',
      reference: paymentRef,
      callback_url: `https://www.4marketdays.com/${
        user_id === '6895cd9fb97e7a9fe487d6e1' ? 'guest-order' : 'orders'
      }?order_id=${order._id}&order_ref=${orderRef}`,
      metadata: {
        orderId: order._id,
        userId: user_id,
      },
    })

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }

    const paystackReq = https.request(options, (paystackRes) => {
      let data = ''

      paystackRes.on('data', chunk => (data += chunk))

      paystackRes.on('end', () => {
        try {
          const response = JSON.parse(data)

          if (!response.status) {
            return res.status(400).json(response)
          }

          return res.status(200).json({
            message: 'Redirecting to payment gateway',
            authorization_url: response.data.authorization_url,
            access_code: response.data.access_code,
            reference: response.data.reference,
            orderId: order._id,
          })
        } catch (err) {
          return res.status(500).json({
            message: 'Invalid Paystack response',
            error: err.message,
          })
        }
      })
    })

    paystackReq.on('error', err =>
      res.status(500).json({ message: 'Payment init failed', error: err.message })
    )

    paystackReq.write(params)
    paystackReq.end()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error', error: error.message })
  }
}

/* =========================
   INVENTORY UPDATE
========================= */
const updateInventory = async order => {
  for (const item of order.orders) {
    const product = await Product.findById(item.prod_id)
    if (product) {
      product.stock = Math.max(0, (product.stock || 0) - item.qty)
      await product.save()
    }
  }
}

/* =========================
   VERIFY PAYMENT
========================= */
export const verifyPayment = async (req, res) => {
  try {
    const { ref, id } = req.body

    if (!ref || !id) {
      return res.status(400).json({ message: 'Reference and order ID required' })
    }

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(ref)}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }

    const paystackReq = https.request(options, (paystackRes) => {
      let data = ''

      paystackRes.on('data', chunk => (data += chunk))

      paystackRes.on('end', async () => {
        try {
          const response = JSON.parse(data)

          const order = await Orders.findById(id)
          const payment = await Payment.findOne({ orderId: id })

          if (!order || !payment) {
            return res.status(404).json({ message: 'Order not found' })
          }

          if (response?.data?.status === 'success') {
            order.paymentStatus = 'PAID'
            payment.paymentRef = ref
            await updateInventory(order)
          } else {
            order.paymentStatus = 'FAILED'
            payment.paymentRef = ref
          }

          await order.save()
          await payment.save()

          return res.status(200).json({
            message: 'Payment verification completed',
            status: order.paymentStatus,
            paystack: response,
          })
        } catch (err) {
          return res.status(500).json({
            message: 'Verification processing error',
            error: err.message,
          })
        }
      })
    })

    paystackReq.on('error', err =>
      res.status(500).json({ message: 'Verification failed', error: err.message })
    )

    paystackReq.end()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error', error: error.message })
  }
}
