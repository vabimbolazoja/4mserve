import Product from '../models/products.js';
import Category from '../models/category.js';
import mongoose from 'mongoose'
// 🔹 Create Product
export const createProduct = async (req, res) => {
  try {
    const { name, category, priceNaira, priceUsd, description, moq, imageUrls,storageInstructions,nutritionalInfo } = req.body;

    const foundCategory = await Category.findById(category);
    if (!foundCategory) return res.status(400).json({ message: 'Invalid category' });

    const existing = await Product.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Product already exists' });

    const product = await Product.create({
      name,
      category,
      priceNaira,
      priceUsd,
      description,
      moq,
      imageUrls,
      storageInstructions, nutritionalInfo

    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Get All Products
export const getProducts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const products = await Product.find()
      .select('name category priceNaira priceUsd moq description nutritionalInfo storageInstructions imageUrls status') // Limit fields
      .populate('category', 'name') // 👈 populate _id and name of category
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments();

    res.status(200).json({
      total: count,
      page,
      pages: Math.ceil(count / limit),
      products, // 👈 category will be like: { _id, name }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


export const getProductsByCategory = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { categoryId } = req.query;

  const query = {};

  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    query.category = new mongoose.Types.ObjectId(categoryId);
  }

  try {
    const products = await Product.find(query)
      .select('name category priceNaira priceUsd nutritionalInfo storageInstructions moq description imageUrls status')
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.status(200).json({
      total: count,
      page,
      pages: Math.ceil(count / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


// 🔹 Get Single Product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Update Product
export const updateProduct = async (req, res) => {
  try {
    const { name, category, priceNaira, priceUsd, description, moq, imageUrls, storageInstructions, nutritionalInfo
    } = req.body;
    const prodstatus = req.body.status ? 'Active' : 'Inactive'

    if (category) {
      const foundCategory = await Category.findById(category);
      if (!foundCategory) return res.status(400).json({ message: 'Invalid category' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, priceNaira, priceUsd, description, moq, imageUrls, status: prodstatus,storageInstructions,nutritionalInfo },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Change Product Status
export const changeProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product status updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
