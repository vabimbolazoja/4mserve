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


// Helper to escape user input before using in RegExp
function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getAllOrders = async (req, res) => {
  try {
    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // --- Remove pagination keys and sanitize incoming params ---
    const raw = { ...req.query };
    delete raw.page;
    delete raw.limit;

    const params = {};
    Object.keys(raw).forEach((k) => {
      let v = raw[k];
      if (Array.isArray(v)) v = v[0];
      if (v === undefined || v === null) return;
      const s = String(v).trim();
      const lower = s.toLowerCase();
      // treat empty, "null", "undefined" as absent
      if (s === "" || lower === "null" || lower === "undefined") return;
      params[k] = s;
    });

    const { search, ...filters } = params;

    // --- Build query only if we actually have filters/search ---
    let query = {};

    if (search) {
      const s = escapeRegex(search);
      query.$or = [
        { ref: s }, // if you want case-insensitive here use regex
        { "deliveryInfo.name": { $regex: s, $options: "i" } },
        { "deliveryInfo.email": { $regex: s, $options: "i" } },
        { "deliveryInfo.phone": { $regex: s, $options: "i" } },
        { "deliveryInfo.address": { $regex: s, $options: "i" } },
        { userEmail: { $regex: s, $options: "i" } },
        { orderStatus: { $regex: s, $options: "i" } },
        { paymentStatus: { $regex: s, $options: "i" } },
        { deliveryStatus: { $regex: s, $options: "i" } },
        { location: { $regex: s, $options: "i" } },
        { rider: { $regex: s, $options: "i" } },
        { paymentType: { $regex: s, $options: "i" } },
        { "orders.prod_name": { $regex: s, $options: "i" } },
      ];
    }

    Object.keys(filters).forEach((key) => {
      // For safety: use case-insensitive exact match for filter values.
      // If you prefer strict equality, you can set: query[key] = filters[key];
      query[key] = new RegExp(`^${escapeRegex(filters[key])}$`, "i");
    });

    // --- DEBUG logs (paste these if it still fails) ---
    console.log("RAW req.query:", req.query);
    console.log("CLEAN params:", params);
    console.log("FINAL query object:", JSON.stringify(query, null, 2));

    // --- Use Order.find() with no argument if query is empty (exact original behaviour) ---
    const useEmptyFind = Object.keys(query).length === 0;

    const baseFind = useEmptyFind
      ? Order.find()        // EXACTLY like your original working code
      : Order.find(query);

    const orders = await baseFind
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "firstName lastName email phoneNumber image",
      });

    // --- attach product + category data (same as your original) ---
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const productsDetailed = await Promise.all(
          (order.orders || []).map(async (item) => {
            if (!item || !item.prod_id) return { ...item };
            const product = await Product.findById(item.prod_id)
              .populate({
                path: "category",
                select: "name description image",
              })
              .select("name priceNaira priceUsd moq description imageUrls category");
            return {
              ...item.toObject ? item.toObject() : item,
              product,
            };
          })
        );

        return {
          ...order.toObject ? order.toObject() : order,
          orders: productsDetailed,
        };
      })
    );

    const totalOrders = await Order.countDocuments(useEmptyFind ? {} : query);

    return res.json({
      success: true,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders: ordersWithProducts,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
  
  