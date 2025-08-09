import Category from '../models/category.js';

// 🔹 Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, image, description, status } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Category already exists' });

    const category = await Category.create({ name, image, description, status });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Get All Categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Get One Category by ID
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Update Category
export const updateCategory = async (req, res) => {
  try {
    const { name, image, description, status } = req.body;
    const catStatus = req.body.status ? 'Active' : 'Inactive'


    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, image, description, status:catStatus },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Change Status
export const changeCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category status updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
