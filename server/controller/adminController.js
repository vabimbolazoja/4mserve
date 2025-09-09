import Users from '../models/user.js';
import Order from '../models/orders.js';
import User from '../models/user.js';
import Product from '../models/products.js';
import Category from '../models/category.js';
// 🔹 Create Product

export const getCustomers = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const customers = await Users.find().skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const count = await Users.countDocuments();

    res.status(200).json({
      total: count,
      page,
      pages: Math.ceil(count / limit),
      customers, // 👈 category will be like: { _id, name }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    // ✅ Pagination values
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Extract search and filters
    const { search, ...filters } = req.query;

    // ✅ Build query object
    let query = {};

    // 🔍 Apply search only if not empty
    if (search && search.trim() !== "") {
      query.$or = [
        { ref: search }, // exact match
        { "deliveryInfo.name": { $regex: search, $options: "i" } },
        { "deliveryInfo.email": { $regex: search, $options: "i" } },
        { "deliveryInfo.phone": { $regex: search, $options: "i" } },
        { "deliveryInfo.address": { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { orderStatus: { $regex: search, $options: "i" } },
        { paymentStatus: { $regex: search, $options: "i" } },
        { deliveryStatus: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { rider: { $regex: search, $options: "i" } },
        { paymentType: { $regex: search, $options: "i" } },
        { "orders.prod_name": { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Apply filters dynamically (ignore empty values)
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value && value.trim() !== "") {
        // exact but case-insensitive
        query[key] = { $regex: `^${value}$`, $options: "i" };
      }
    });

    // ✅ Fetch orders with user details
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "firstName lastName email phoneNumber image",
      });

    // ✅ Attach product + category details for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const productsDetailed = await Promise.all(
          order.orders.map(async (item) => {
            const product = await Product.findById(item.prod_id)
              .populate({
                path: "category",
                select: "name description image",
              })
              .select("name priceNaira priceUsd moq description imageUrls category");

            return {
              ...item.toObject(),
              product,
            };
          })
        );

        return {
          ...order.toObject(),
          orders: productsDetailed,
        };
      })
    );

    // ✅ Count for pagination
    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders: ordersWithProducts,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


  export const getPendingDelivery = async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      // Step 1: Find filtered orders (PAID + not DELIVERED)
      const filter = {
        paymentStatus: "PAID",
        orderStatus: { $ne: "DELIVERED" }, // $ne = not equal
      };
  
      const orders = await Order.find(filter)
        .sort({ createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(limit)
        .populate({
          path: "userId",
          select: "firstName lastName email phoneNumber image",
        });
  
      // Step 2: Attach full product + category data
      const ordersWithProducts = await Promise.all(
        orders.map(async (order) => {
          const productsDetailed = await Promise.all(
            order.orders.map(async (item) => {
              const product = await Product.findById(item.prod_id)
                .populate({
                  path: "category",
                  select: "name description image",
                })
                .select(
                  "name priceNaira priceUsd moq description imageUrls category"
                );
  
              return {
                ...item.toObject(),
                product,
              };
            })
          );
  
          return {
            ...order.toObject(),
            orders: productsDetailed,
          };
        })
      );
  
      // Step 3: Total count for pagination (with filter applied)
      const totalOrders = await Order.countDocuments(filter);
  
      res.json({
        success: true,
        page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        orders: ordersWithProducts,
      });
    } catch (error) {
      console.error("Error fetching paid & undelivered orders:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  
  export const addressDelivery = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
  
      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }
  
      // Update order fields
      order.location = req.body.location;
      order.orderStatus = req.body.status;
      order.expectedDate = req.body.date;
      order.rider = req.body.name;
  
      // Save updated order
      const updatedOrder = await order.save();
  
      return res.status(200).json({
        productupdate: updatedOrder,
        msg: "Delivery Updated Successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        msg: "An error occurred while updating delivery",
        error: error.message,
      });
    }
  };
  
  
  export const guestTrack = async (req, res) => {
    try {
      // ✅ safely extract param
      const { order_ref } = req.params;
  
      if (!order_ref) {
        return res.status(400).json({
          success: false,
          message: "Order reference (order_ref) is required",
        });
      }
  
      // ✅ match your schema field name exactly ("ref" or "order_ref")
      const order = await Order.findOne({ ref: order_ref });
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Tracking order is invalid", // 👈 custom exception message
          orders: [],
        });
      }
  
      // Always return as an array even if single
      res.status(200).json({
        success: true,
        totalOrders: 1,
        orders: [order],
      });
    } catch (error) {
      console.error("Error fetching order by ref:", error);
      res.status(500).json({
        success: false,
        message: "Server error. Could not fetch order.",
        error: error.message,
      });
    }
  };
  
  