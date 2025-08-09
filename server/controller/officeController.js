var User = require("../models/User");
var Product = require("../models/product");
var Waitlist = require("../models/waitlist");
const Admins = require("../models/admins");
var Payment = require("../models/order-payments");
const Config = require("../models/configs");
const ConfigNgn = require("../models/configs-ngn");
const Orders = require("../models/orders");

module.exports = {
  create: (req, res, next) => {
    const product = new Product({
      name: req.body.name,
      origin: req.body.origin,
      priceCurrency: req.body.priceCurrency,
      price: req.body.price,
      priceNaira: req.body.priceNaira,
      stock: req.body.stock,
      moq: req.body.moq,
      description: req.body.description,
      image: req.body.image,
      audience: req.body.audience,
      image2: req.body.image2,
      image3: req.body.image3,
      image4: req.body.image4,
      priceUsd: req.body?.price,
      category: req.body.category,
      rate: req.body.rating,
    });
    const productCreated = product.save();
    if (product) {
      res.status(201).json({
        product: product,
        msg: "Product Created Successfully",
      });
    }
  },


  removeAdmin: (req, res, next) => {
    const products = Admins.remove({ _id: req.params?.id }, (err, result) => {
      if (result) {
        res.json({
          message: "Admin deleted successfully",
        });
      } else {
        res.json({
          message: "Something went wrong",
        });
      }
    });
  },



  verifyPayStack: (requests, resp) => {
    const https = require("https");
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${requests?.body?.ref}`,
      method: "GET",
      headers: {
        Authorization:
          "Bearer sk_test_92a47ab7bda3652635ea0e3049e37ac5017f965c",
      },
      timeout: 5000,
    };
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        var responseJson = JSON.parse(data);
        Orders.findById(requests.body.id, (error, result) => {
          if (result) {
            console.log(result.payment_status);
            result.payment_status = "COMPLETED";
            result.ref = requests?.body?.ref
            const product = result.save();
            resp.status(200).json({
              data: responseJson,
              msg: "Order Updated Successfully",
            });

          }
        });

      });
    });

    req.on("timeout", () => {
      console.error("Request timed out");
      req.abort(); // Abort the request
    });

    req.on("error", (error) => {
      console.error("Request error:", error.message);
      Orders.findById(requests.body.id, (error, result) => {
        if (result) {
          result.payment_status = "FAILED";
          result.ref = requests?.body?.ref
          const product = result.save();
          resp.status(200).json({
            data: responseJson,
            msg: "Order Retrieved Successfully",
          });

        }
      });
      res.json({ error });
    });

    req.end();

  },

  paystackPayment: (reqeust, resp) => {
    const https = require("https");
    const product = new Orders({
      deliveryInfo: reqeust.body.deliveryInfo,
      orders: reqeust.body.orders,
      user_email: reqeust.body.user_email,
      user_id: reqeust.body.user_id,
      totalAmt: reqeust.body.totalAmt,
      paymentType: reqeust.body.paymentType,
      ref:
        new Date().getTime().toString(36) + Math.random().toString(36).slice(2),
    });
    const payment = new Payment({
      amount: reqeust.body.totalAmt,
      user_id: reqeust.body.user_id,
      payment_type: reqeust.body.paymentType,
      order_id: product._id,
      payment_reciept: reqeust.body.reciept,
      payment_ref:
        new Date().getTime().toString(36) + Math.random().toString(36).slice(2),
    });
    console.log('testing')
    product.save();
    payment.save();
    console.log('log paument record')
    console.log(product)
    if (product?._id) {
      const params = JSON.stringify({
        email: reqeust?.body.user_email,
        amount: reqeust?.body.totalAmt * 100,
        currency: reqeust.body.paymentType,
        callback_url: `http://localhost:3000/product-orders?order_id=${product._id}`, // Your redirect URL
      });

      const options = {
        hostname: "api.paystack.co",
        port: 443,
        path: "/transaction/initialize",
        method: "POST",
        headers: {
          Authorization:
            "Bearer sk_test_92a47ab7bda3652635ea0e3049e37ac5017f965c",
          "Content-Type": "application/json",
        },
      };

      const req = https
        .request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            var responseJson = JSON.parse(data);
            resp.status(200).json({
              data: responseJson,
              msg: "Order Created Successfully",
            });
          });
        })
        .on("error", (error) => {
          console.error(error);
          resp.status(400).json({
            error,
          });
        });

      req.write(params);
      req.end();
    }
  },

  createConfig: (req, res, next) => {
    const product = new Config({
      taxFee: req.body.name,
      exchangeRate: req.body.value,
      shippingFee: req.body.description,
      discount: req.body.discount,
      currency:'USD'
    });
    const productCreated = product.save();
    if (product) {
      res.status(201).json({
        product: product,
        msg: "Config Created Successfully",
      });
    }
  },
  createConfigNgn: (req, res, next) => {
    const product = new ConfigNgn({
      taxFee: req.body.name,
      exchangeRate: req.body.value,
      shippingFee: req.body.description,
      discount: req.body.discount,
      currency:'NGN'
    });
    const productCreated = product.save();
    if (product) {
      res.status(201).json({
        product: product,
        msg: "Config Created Successfully",
      });
    }
  },

  updateConfig: (req, res, next) => {
    Config.findById({_id:"67682c738432c585b75cf91e"}, (error, result) => {
      if (result) {
        result.taxFee = req.body.name;
        result.exchangeRate = req.body.value;
        result.shippingFee = req.body.description;
        result.discount = req.body.discount;
        const product = result.save();
        if (result) {
          res.status(200).json({
            productupdate: result,
            msg: "Config Updated Successfully",
          });
        } else {
          res.status(500).json({
            msg: error,
          });
        }
      }
    });
  },

  updateConfigNgn: (req, res, next) => {
    ConfigNgn.findById({_id: "67682c828432c585b75cf91f"}, (error, result) => {
      if (result) {
        result.taxFee = req.body.name;
        result.exchangeRate = req.body.value;
        result.shippingFee = req.body.description;
        result.discount = req.body.discount;
        const product = result.save();
        if (result) {
          res.status(200).json({
            configs: result,
            msg: "Config Updated Successfully",
          });
        } else {
          res.status(500).json({
            msg: error,
          });
        }
      }
    });
  },

  edit: (req, res) => {
    Product.findById(req.params.id, (error, result) => {
      if (result) {
        result.name = req.body.name;
        result.origin = req.body.origin;
        result.description = req.body.description;
        result.rate = req.body.rating;
        result.price = req.body.price;
        result.audience = req.body.audience,
          result.moq = req.body.moq;
        result.stock = req.body.stock;
        result.image = req.body.image;
        result.priceNaira = req.body.priceNaira;
        result.image2 = req.body.image2;
        result.image3 = req.body.image3;
        result.image4 = req.body.image4;

        result.category = req.body.category;
        const product = result.save();
        if (result) {
          res.status(200).json({
            productupdate: result,
            msg: "Product Updated Successfully",
          });
        } else {
          res.status(500).json({
            msg: error,
          });
        }
      }
    });
  },

  alterStatus: (req, res) => {
    const product = Product.findById(req.params.id, (err, result) => {
      if (result) {
        result.status = result.status === "Active" ? "Inactive" : "Active";
        const product = result.save();
        if (result) {
          res.status(200).json({
            productupdate: result,
            msg: "Product status modified Successfully",
          });
        } else {
          res.status(500).json({
            msg: err,
          });
        }
      }
    });
  },

  getProdSingle: (req, res) => {
    const product = Product.findById(req.params.id, (err, result) => {
      if (result) {
        res.status(200).json({
          product: result,
          msg: "Product retrieved Successfully",
        });
      } else {
        res.status(500).json({
          msg: err,
        });
      }
    });
  },

  
  allUsers: (req, res) => {
    const products = Admins.find({}, (err, result) => {
      if (result) {
        res.json({
          admins: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  allProducts: (req, res) => {
    const products = Product.find({status:'Active'}, (err, result) => {
      if (result) {
        res.json({
          products: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  Stats: async (req, res) => {
    const docCount = await User.countDocuments({}).exec();
    const admindocCount = await Admins.countDocuments({}).exec();
    const proddocCount = await Product.countDocuments({}).exec();
    const orderdocCount = await Orders.countDocuments({}).exec();

    res.status(200).json({
      allCounts: {
        docCount,
        admindocCount,
        proddocCount,
        orderdocCount,
      },
    });
  },

  allOrders: (req, res) => {
    const products = Orders.find({}, (err, result) => {
      if (result) {
        res.json({
          orders: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  allOrdersPayment: (req, res) => {
    const products = Payment.find({}, (err, result) => {
      if (result) {
        res.json({
          orders: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  confirmPayment: (req, res) => {
    Payment.findById(req.params.id, (error, result) => {
      if (result) {
        Orders.findById(req.body.orderId, (error, result2) => {
          if (result2) {
            console.log(result2);
            result2.payment_status = "COMPLETED";
            const product2 = result2.save();
          }
        });
        result.payment_status = "COMPLETED";
        const product = result.save();
        res.status(200).json({
          msg: "Delivery Updated Successfully",
        });
      } else {
        res.status(500).json({
          msg: error,
        });
      }
    });
  },

  allUserOrders: (req, res) => {
    const products = Orders.find({ user_id: req.params.id }, (err, result) => {
      if (result) {
        console.log(result);
        res.json({
          orders: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  getDeliveries: (req, res) => {
    Orders.findById(req.params.id, (error, result) => {
      if (result) {
        res.status(200).json({
          delivery: result,
          msg: "Delivery Updated Successfully",
        });
      } else {
        res.status(500).json({
          msg: error,
        });
      }
    });
  },

  addressDelivery: (req, res) => {
    Orders.findById(req.params.id, (error, result) => {
      if (result) {
        result.currentLocation = req.body.location;
        result.delivery_status = req.body.status;
        result.timeDelivery = req.body.time;
        result.riderName = req.body.name;
        const product = result.save();
        if (result) {
          res.status(200).json({
            productupdate: result,
            msg: "Delivery Updated Successfully",
          });
        } else {
          res.status(500).json({
            msg: error,
          });
        }
      }
    });
  },

  allCats: (req, res) => {
    const products = Product.find({}, (err, result) => {
      if (result) {
        res.json({
          products: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  allConfgis: (req, res) => {
    const products = Config.findById(
      "67682c738432c585b75cf91e",
      (err, result) => {
        if (result) {
          res.json({
            configs: result,
          });
        } else {
          res.json({
            error: err,
          });
        }
      }
    ).sort({ _id: -1 });
  },

  allConfgisNgn: (req, res) => {
    const products = ConfigNgn.findById(
      "67682c828432c585b75cf91f",
      (err, result) => {
        if (result) {
          res.json({
            configs: result,
          });
        } else {
          res.json({
            error: err,
          });
        }
      }
    ).sort({ _id: -1 });
  },

  getUsers: (req, res) => {
    const products = User.find({ isAdmin: false }, (err, result) => {
      if (result) {
        res.json({
          users: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  getAdmins: (req, res) => {
    const users = Admins.find({}, (err, result) => {
      if (result) {
        res.json({
          users: result,
        });
      } else {
        res.json({
          error: err,
        });
      }
    }).sort({ _id: -1 });
  },

  upload: (req, res, next) => {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "./uploads/");
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
      },
    });

    const fileFilter = (req, res, cd) => {
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
      } else {
        cb(null, false);
      }
    };

    const upload = multer({
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 5,
      },
      fileFilter: fileFilter,
    });

    const image = new Product({
      image: req.file.path,
    });

    const ImageSave = image.save();
    res.json({
      success: true,
      image: image,
    });
    next;
  },
};
