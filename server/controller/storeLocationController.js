import Store from '../models/store.js';
import mongoose from 'mongoose'
// 🔹 Create Product
export const createStore = async (req, res) => {
    try {
        const { name, state, postalcode, country, address } = req.body;

        const existing = await Store.findOne({ name });
        if (existing) return res.status(400).json({ message: 'Store Location already exists' });

        const store = await Store.create({
            name,
            address,
            state,
            postalcode,
            country,
            address,

        });

        res.status(201).json(store);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const getStoresClient = async (req,res) => {
    try {
        const filter = { status: 'Active' };
        const store = await Store.find(filter)
        res.status(200).json({

            store,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
}

export const getStores = async (req,res) => {
    try {
        const filter = {};
        const store = await Store.find(filter)
        res.status(200).json({

            store,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
}





export const updateStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ msg: "Store not found" });
        }

        // Update order fields
        store.name = req.body.name;
        store.address = req.body.address;
        store.state = req.body.state;
        store.country = req.body.country;
        store.postalcode = req.body.postalcode;


        // Save updated order
        const updatedOrder = await store.save();

        return res.status(200).json({
            productupdate: updatedOrder,
            msg: "Store Updated Successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "An error occurred while updating store",
            error: error.message,
        });
    }
};

export const deleteStore = async (req, res) => {
    try {
        const store = await Store.findByIdAndDelete(req.params.id);
        if (!store) return res.status(404).json({ message: 'Store not found' });

        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const changeStoreStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!store) return res.status(404).json({ message: 'Store not found' });

        res.json({ message: 'Store status updated', status });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
