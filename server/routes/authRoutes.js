import express from 'express';
import { initiatePasswordReset, resetPassword, login, verifyEmailAddress, register, registerAdmin, loginAdmin, verifyEmailAddressResend } from '../controller/authController.js';
import { protect } from '../middlewares/auth-middleware.js';
import { protectAdmin } from '../middlewares/admin-middleware.js';
import {validateAddress} from "../controller/addressController.js"
import { getAllConfigs, getConfigByCountry, upsertConfig } from "../service/configService.js";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getActiveProductsByCategory,
  getActiveProducts

} from '../controller/productController.js';
import {
  verifyPayment,
  initiatePayment,
  allUserOrders
} from '../controller/paymentController.js'
import { getCustomers,guestTrack, getAllOrders ,getPendingDelivery,addressDelivery} from "../controller/adminController.js"
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  changeCategoryStatus,
} from '../controller/categoryController.js'
import Admin from '../models/admins.js';
const router = express.Router();
router.post('/register', register);
router.get('/verify-mail', verifyEmailAddress);
router.get('/resend-mail-verify', verifyEmailAddressResend);
router.post('/login', login);
router.get('/forgot-password', initiatePasswordReset);
router.post('/reset-password', resetPassword);
router.post('/admin/user', registerAdmin);
router.post('/admin/login', loginAdmin)
router.get('/categories', getCategories);

router.post('/order/initiate', initiatePayment);
router.post('/order/verify', verifyPayment);
router.get('/orders/customer/:id', allUserOrders);
router.get('/orders/guest/:order_ref', guestTrack);


// Get all country configs
router.get("/moderations/config", async (req, res) => {
  try {
    const configs = await getAllConfigs();
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one country's config
router.get("/moderations/:country", async (req, res) => {
  try {
    const { country } = req.params;
    const config = await getConfigByCountry(country);
    if (!config) return res.status(404).json({ message: "Config not found" });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update or create config for a country
router.put("/moderations/:country", async (req, res) => {
  try {
    const { country } = req.params;
    const deliveryPriceInKg  = req.body?.price;
    const config = await upsertConfig(country, deliveryPriceInKg);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/admin/category', protectAdmin, createCategory);
router.get('/admin/categories', protectAdmin, getCategories);
router.put('/admin/category/:id', protectAdmin, updateCategory);
router.delete('/admin/category/:id', protectAdmin, deleteCategory);
router.get('/admin/category/:id', protectAdmin, deleteCategory);



router.get('/admin/customers', protectAdmin, getCustomers);
router.get('/admin/orders', protectAdmin, getAllOrders);
router.get('/admin/orders-delivery', protectAdmin, getPendingDelivery);
router.put('/admin/orders-delivery-address/:id', protectAdmin, addressDelivery);

router.get('/products-active', getActiveProducts);
router.get('/productCategory-active', getActiveProductsByCategory);


router.post('/admin/product', protectAdmin, createProduct);
router.get('/products', getProducts);
router.get('/product/:id', getProduct);
router.get('/productCategory', getProductsByCategory);
router.put('/admin/product/:id', protectAdmin, updateProduct);
router.delete('/product/:id', protectAdmin, deleteProduct);
router.get('/validate-address', validateAddress);

router.get("/auth/user", protectAdmin, async (req, res) => {
  const user = await Admin.findById(req.user.id).select("-password");
  if (!user) return res.status(401).json({ message: "Not authenticated" });
  res.json(user);
});

export default router;
