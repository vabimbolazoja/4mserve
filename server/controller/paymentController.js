
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

    const randomNumbersOrders = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    const randomNumbersPmt = Math.floor(100000 + Math.random() * 900000); // 6-digit random number



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

    const resolvedCurrency = paymentType === 'USD' ? 'USD' : 'NGN';


    // Create payment record
    const payment = new Payment({
      amount: totalAmt,
      userId: user_id,
      paymentType: resolvedCurrency,
      orderId: order._id,
      paymentRef: `PMT-4MT-${randomNumbersPmt}`
    });

    // Save both to DB
    await order.save();
    await payment.save();

    // Prepare Paystack params
    const params = JSON.stringify({
      email: user_email,
      amount: totalAmt * 100,
      currency: paymentType,
      callback_url: `${`https://www.4marketdays.com`}/${user_id === '6895cd9fb97e7a9fe487d6e1' ? 'guest-order' : 'orders'}?order_id=${order._id}&order_ref=${order?.ref}`,
    });

    

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
     
      headers: {
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
  'Content-Length': Buffer.byteLength(params),
}

    };

    // Make request to Paystack
    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';
      paystackRes.on('data', (chunk) => { data += chunk; });
      paystackRes.on('end', () => {
        const responseJson = JSON.parse(data);
        return res.status(200).json({
          message: 'Order Submitted Successfully, You will be redirdected to the payment page to complete payment',
          paystack: responseJson,
          orderId: order._id,
        });
      });
    });

    paystackReq.on('error', (error) => {
      console.error(error);
      return res.status(500).json({ message: 'Payment initialization failed', error: error.message });
    });

    paystackReq.write(params);
    paystackReq.end();

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
    const { ref, id } = req.body;

    if (!ref || !id) {
      return res.status(400).json({ message: "Payment reference and order ID are required" });
    }

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(ref)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      timeout: 5000,
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = "";

      paystackRes.on("data", (chunk) => {
        data += chunk;
      });

      paystackRes.on("end", async () => {
        try {
          const responseJson = JSON.parse(data);

          const order = await Orders.findById(id);
          const payment = await Payment.findOne({ orderId: id });

          if (!order) {
            return res.status(404).json({ message: "Order not found" });
          }

          if (responseJson?.data?.status === "success") {
            order.paymentStatus = "PAID";
            payment.paymentRef = ref;

            // Update inventory here
            await updateInventory(order);
          } else {
            order.paymentStatus = "FAILED";
            payment.paymentRef = ref;
          }

          await order.save();

          return res.status(200).json({
            message: "Order updated successfully",
            paystack: responseJson,
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

    paystackReq.on("timeout", () => {
      console.error("Paystack request timed out");
      paystackReq.abort();
      return res.status(504).json({ message: "Payment verification request timed out" });
    });

    paystackReq.on("error", (error) => {
      console.error("Paystack request error:", error.message);
      return res.status(500).json({
        message: "Payment verification failed",
        error: error.message,
      });
    });

    paystackReq.end();
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
