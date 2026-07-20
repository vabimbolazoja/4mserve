
import https from 'https';
import Orders from '../models/orders.js';
import Payment from '../models/payment.js';
import Product from "../models/products.js"
export const initiatePayment = async (req, res) => {
  try {
    // Extract and validate request body
    const { deliveryInfo, orders, user_email, user_id, totalAmt, paymentType, deliveryCost, totalSub } = req.body;

    if (!deliveryInfo || !orders?.length || !user_email || !user_id || !totalAmt || !paymentType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (paymentType === 'USD' && Number(totalAmt) < 2) {
      return res.status(400).json({
        message: 'Minimum USD payment is $2'
      });

    }

    const randomNumbersOrders = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    const randomNumbersPmt = Math.floor(100000 + Math.random() * 900000); // 6-digit random number


    console.log(paymentType,'payment type')



    // Create order
    const order = new Orders({
      deliveryInfo,
      orders,
      userEmail: user_email,
      userId: user_id,
      totalAmt,
      paymentType,
      deliveryCost,
      totalSub,
      ref: `ORD-4MT-${randomNumbersOrders}`
    });



    // Create payment record
    const payment = new Payment({
      amount: totalAmt,
      userId: user_id,
      paymentType,
      orderId: order._id,
      paymentRef: `PMT-4MT-${randomNumbersPmt}`
    });

    // Save both to DB
    await order.save();
    await payment.save();

    // Prepare Flutterwave hosted checkout params.
    // Flutterwave expects amount in major units (e.g. 3.00 => "3" or "3.00"), NOT multiplied by 100.
    const flwSecretKey = 'FLWSECK-88a493e9765a2fde7e482b9473ae27ef-19f7ee1b253vt-X'
    if (!flwSecretKey) {
      return res.status(500).json({
        message: 'Flutterwave secret key is missing (set FLW_SECRET_KEY or FLUTTERWAVE_SECRET_KEY).',
      });
    }

    const callbackUrl = `${`https://www.4marketdays.com`}/${user_id === '6895cd9fb97e7a9fe487d6e1' ? 'guest-order' : 'orders'}?order_id=${order._id}&order_ref=${order?.ref}`;

    // Use `order.ref` as tx_ref so verification can reliably match our internal order.
    const txRef = order.ref;
    const payload = JSON.stringify({
      tx_ref: txRef,
      amount: String(totalAmt),
      currency: paymentType,
      redirect_url: callbackUrl,
      customer: {
        email: user_email,
      },
      // Keep payment metadata lightweight; we already persist order/payment on our DB.
      meta: {
        order_id: String(order._id),
      },
    });

    const options = {
      hostname: 'api.flutterwave.com',
      port: 443,
      path: '/v3/payments',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const flwReq = https.request(options, (flwRes) => {
      let data = '';
      flwRes.on('data', (chunk) => {
        data += chunk;
      });
      flwRes.on('end', () => {
        const responseJson = JSON.parse(data);
        if (responseJson?.status !== 'success') {
          return res.status(400).json({
            message: 'Flutterwave payment initialization failed',
            flutterwave: responseJson,
            orderId: order._id,
          });
        }

        return res.status(200).json({
          message: 'Order Submitted Successfully, redirecting to the Flutterwave checkout page.',
          flutterwave: responseJson,
          payment_link: responseJson?.data?.link,
          orderId: order._id,
          tx_ref: txRef,
        });
      });
    });

    flwReq.on('error', (error) => {
      console.error(error);
      return res.status(500).json({ message: 'Payment initialization failed', error: error.message });
    });

    flwReq.write(payload);
    flwReq.end();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateInventory = async (order) => {
  for (const item of order.orders) {
    const product = await Product.findById(item.prod_id);
    if (product) {
      // Ensure quantity doesn't go negative
      product.stock = Math.max(0, (product.stock || 0) - item.qty);
      await product.save();
    }
  }
};

export const verifyPayment = async (req, res) => {
  try {
    // To keep backward compatibility with your previous Paystack payload,
    // accept a few possible field names:
    // - ref (Paystack) -> tx_ref (Flutterwave)
    // - id -> order_id
    const {
      ref,
      id,
      tx_ref,
      transaction_id,
      order_ref,
      order_id,
    } = req.body;

    const flwSecretKey = 'FLWSECK-88a493e9765a2fde7e482b9473ae27ef-19f7ee1b253vt-X';
    if (!flwSecretKey) {
      return res.status(500).json({
        message: 'Flutterwave secret key is missing (set FLW_SECRET_KEY or FLUTTERWAVE_SECRET_KEY).',
      });
    }

    const orderId = id || order_id;
    const txRef = ref || tx_ref || order_ref;

    if (!orderId || (!txRef && !transaction_id)) {
      return res.status(400).json({
        message: 'Order ID and Flutterwave reference are required (orderId + tx_ref).',
      });
    }

    // Preferred: verify using tx_ref (matches plan + hosted checkout).
    const useTxRefVerification = Boolean(txRef);
    const path = useTxRefVerification
      ? `/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`
      : `/v3/transactions/${encodeURIComponent(transaction_id)}/verify`;

    const options = {
      hostname: 'api.flutterwave.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
      },
      timeout: 10000,
    };

    const flwReq = https.request(options, (flwRes) => {
      let data = '';

      flwRes.on('data', (chunk) => {
        data += chunk;
      });

      flwRes.on('end', async () => {
        try {
          const responseJson = JSON.parse(data);

          const order = await Orders.findById(orderId);
          if (!order) {
            return res.status(404).json({ message: "Order not found" });
          }

          // Flutterwave typically returns:
          // { status: "success", data: { status: "successful" | "failed" ... } }
          const verifiedStatus = responseJson?.data?.status;
          const isSuccessful = verifiedStatus === 'successful';
          const flutterwaveRef = responseJson?.data?.flw_ref;

          let payment = await Payment.findOne({ orderId });
          if (!payment) {
            // Create a payment record if it doesn't exist yet (prevents crashes)
            payment = new Payment({
              amount: order?.totalAmt,
              userId: order?.userId,
              paymentType: order?.paymentType,
              orderId: order._id,
              paymentRef: flutterwaveRef || txRef || String(transaction_id || ''),
            });
          }

          order.paymentStatus = isSuccessful ? 'PAID' : 'FAILED';
          payment.paymentRef = flutterwaveRef || txRef || payment.paymentRef;

          if (isSuccessful) {
            await updateInventory(order);
          }

          await payment.save();
          await order.save();

          return res.status(200).json({
            message: "Order updated successfully",
            flutterwave: responseJson,
            orderId: order._id,
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({
            message: "Error processing payment verification",
            error: err.message,
          });
        }
      });
    });

    flwReq.on('timeout', () => {
      console.error("Flutterwave request timed out");
      flwReq.abort();
      return res.status(504).json({ message: "Payment verification request timed out" });
    });

    flwReq.on('error', (error) => {
      console.error("Flutterwave request error:", error.message);
      return res.status(500).json({
        message: "Payment verification failed",
        error: error.message,
      });
    });

    flwReq.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const allUserOrders = async (req, res) => {
  try {
    const userId = req.params.id;

    // Pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1); // default page 1
    const limit = Math.max(1, parseInt(req.query.limit) || 10); // default 10 per page
    const skip = (page - 1) * limit;

    // Query filter
    const filter = { userId };

    // Fetch paginated + latest first orders
    const orders = await Orders.find(filter)
      .sort({ createdAt: -1 }) // ensure you're sorting by actual timestamp field
      .skip(skip)
      .limit(limit);

    // Count total orders
    const totalOrders = await Orders.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Could not fetch orders.",
      error: error.message,
    });
  }
};
