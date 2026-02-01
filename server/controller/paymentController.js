import { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from '../context/cartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import config from "../../src/config"
import { useToast } from "@/hooks/use-toast";
import paymentService from "../services/payment-service"
import axios from 'axios'
import { GlobalStateContext } from "../context/globalContext"
import { Radio, Modal } from 'antd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import configService from "../services/config-service"
export default function Cart() {

  const { state, clearCart, incrementItem, decrementItem, removeItem } = useCart();
  const [openPaymentDetails, setOpenPaymentDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [guestForm, setGuestForm] = useState(false)
  const [openCartDetails, setOpenCardDetails] = useState(false)
  const [paymentPage, setPaymentPage] = useState(false)
  const [isValidating, setVerifyingAddress] = useState(false)
  const [acceptValid, setAcceptValid] = useState(false)
  const [validAddress, setValidAddress] = useState(true)
  const { origin, setOrigin } = useContext(GlobalStateContext);
  const [addressInvalid, setAddressInvalid] = useState(false)
  const [status, setStatus] = useState("")
  const [location, setLocation] = useLocation();
  const [addObj, setAddObj] = useState({})
  const [deliveryCountry, setDeliveryCountry] = useState("")
  const { toast } = useToast();
  const [radioValue, setRadioValue] = useState(1);
  const [configData, setConfigData] = useState<any[]>([]);


  const style = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };
  const onChange = (e) => {
    setRadioValue(e.target.value);
  };
  const [formData, setFormData] = useState({
    email: '',
    deliveryAddress: '',
    fullName: sessionStorage?.getItem('4mtfname') ? sessionStorage?.getItem('4mtfname') : "",
    phone: "",
    postalCode: "",
    country: ""
  });
  const [guestData, setGuestData] = useState({
    email: '',
    deliveryAddress: '',
    fullName: "",
    phone: "",
    postalCode: "",
    country: ""
  });
  const total = state.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleAddressSelect = (data: any) => {
    console.log(data)
  }



  useEffect(() => {
    getConfigs()
    window.scrollTo(0, 0);
  }, []);

  const getConfigs = async () => {
    try {
      const result = await configService.getConfigs();
      const arr = Object.values(result).filter((item) => typeof item === "object");
      setConfigData(arr)

    } catch (err: any) {

    }
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleInputChangeGuest = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const cartItems = state?.items;

  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');

  const updateQuantityDecrease = (id: number) => {
    decrementItem(id)
  };

  const updateQuantityIncrease = (id: number) => {
    incrementItem(id)
  };

  const removeItemUpdate = (id: number) => {
    removeItem(id)
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = origin?.sourceOrigin === "0" ? parseFloat(item.priceUsd) : parseFloat(item.priceNaira);
      return total + (price * item.quantity);
    }, 0);
  };

  function generateDeliveryFee(): number {
    if (!cartItems.length || !configData.length || !deliveryCountry) return 0;

    // find the matching config for the deliveryCountry
    const matchedConfig = configData.find((config) =>
      config.country.toLowerCase().includes(deliveryCountry.toLowerCase())
    );

    if (!matchedConfig) return 0;

    const pricePerKg = matchedConfig.deliveryPriceInKg;

    // calculate total delivery fee
    return cartItems.reduce((total, item) => {
      return total + item.quantity * pricePerKg;
    }, 0);
  }



  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-24 w-24 text-slate-300 mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any authentic African foods to your cart yet.
              Start exploring our amazing selection!
            </p>
            <Link href="/products">
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 shadow-lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  const validateForm = (phone: any, postalCode: any) => {
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    const postalCodeRegex = /^[A-Za-z0-9\s-]{4,10}$/;

    let errors: any = {};

    // Phone validation
    if (!phoneRegex.test(phone)) {
      errors.phone = "Please enter a valid phone number (7–15 digits, optional +).";
    }

    // Postal code validation
    if (origin?.sourceOrigin === "0") {
      if (!postalCodeRegex.test(postalCode)) {
        errors.postalCode = "Please enter a valid postal code (4–10 characters, letters/numbers only).";
      }
    }

    return errors;
  };





  const handleSubmitGuest = (e) => {

    e.preventDefault()
    if (radioValue === 1) {
      setGuestForm(true)
    }
    else if (radioValue === 2) {
      setLocation("/login")
    }
    else if (radioValue === 3) {
      setLocation("/register")
    }
    else {
      window.location.href = "/"
    }
  }

  const validateAddressString = (address, postalCode, countryinputed) => {
    if (!address || typeof address !== "string") {
      return { valid: false, message: "Address must be a string", country: null };
    }

    const lowerAddress = address.toLowerCase();

    // Check for "street"
    const hasStreet = lowerAddress.includes("street");

    // Country list (normalize to lowercase for matching)
    const countries = ["Nigeria", "USA", "Canada", "United States", "UK", "Netherlands"];

    // Find actual matched country (case-insensitive)
    const matchedCountry = countries.find(country =>
      countryinputed?.toLowerCase().includes(country.toLowerCase())
    );

    // ✅ If no country match at all
    if (!matchedCountry) {
      return {
        valid: false,
        message: "Address not supported for delivery",
        country: null
      };
    }

    // ✅ If country exists, check rest
    if (hasStreet) {
      return { valid: true, message: "Valid address", country: matchedCountry };
    } else {
      return {
        valid: false,
        message: `Invalid address: missing ${[
          !hasStreet && "street",
          postalCode ? !postalCode && "postal code" : ""
        ].filter(Boolean).join(", ")
          }`,
        country: matchedCountry
      };
    }
  };



  const proceedPayment = () => {
    setOpenPaymentDetails(true)
  }


  const validateAddress = (address: string, postalCode: string, country: string) => {
    if (!address) {
      setStatus("Input valid delivery address");
      setAddressInvalid(true);
      setValidAddress(true);
      return;
    }

    const result = validateAddressString(address, postalCode, country);
    setDeliveryCountry(result.country);
    setAcceptValid(result.valid);
    setStatus(result.message);
    toast({
      title: "Checkout",
      description: result.message,
      variant: "destructive",

    });
    setAddressInvalid(true);
    setValidAddress(true);

    if (result.valid) {
      const cont = origin?.sourceOrigin === "1" ? "Nigeria" : "Others";

      if (origin?.sourceOrigin === "1") {
        if (country.toLowerCase().includes(cont.toLowerCase())) {
          setStatus(`✅ ${address}`);
          toast({
            title: "Checkout",
            description: `✅ ${address}`,
          });
          setValidAddress(false);
          setOpenCardDetails(true)
          setOpenPaymentDetails(false)
          setAddressInvalid(false);
        } else {
          setStatus("Shopping Location does not match provided address");
          toast({
            title: "Checkout",
            description: "Shopping Location does not match provided address",
            variant: "destructive",
          });
          setAddressInvalid(true);
          setValidAddress(true);
        }
      } else {
        setStatus(`✅ ${address}`);
        toast({
          title: "Checkout",
          description: `✅ ${address}`,


        });
        setValidAddress(false);
        setOpenPaymentDetails(false)
        setOpenCardDetails(true)
        setAddressInvalid(false);
      }
    }
  };


  const address = sessionStorage?.getItem('4mttoken') ? formData?.deliveryAddress : guestData?.deliveryAddress;
  const postalcode = sessionStorage?.getItem('4mttoken') ? formData?.postalCode : guestData?.postalCode;
  const country = sessionStorage?.getItem('4mttoken') ? formData?.country : guestData?.country;





  const calculateGrandTotal = (): string => {
    const productTotal = calculateTotal() || 0;      // make sure this returns a number
    const deliveryFee = generateDeliveryFee() || 0;  // make sure this returns a number

    const grandTotal = productTotal + deliveryFee;

    return grandTotal
  };



  const handleGuestPay = async (e) => {
    e.preventDefault();


    setIsLoading(true);
    const deliveryInfo = {
      name: guestData?.fullName,
      email: guestData?.email,
      phone: guestData?.phone,
      address: guestData?.deliveryAddress ? guestData?.deliveryAddress : "USA",
    }



    const data = {
      deliveryInfo: deliveryInfo,
      user_id: '6895cd9fb97e7a9fe487d6e1',
      user_email: guestData?.email,
      currency: origin?.sourceOrigin === "0" ? 'USD' : 'NGN',
      orders: cartItems?.map((d) => ({
        prod_id: d?._id,
        prod_name: d?.name,
        moq: d?.moq,
        image: d?.imageUrls[0],
        price: currency === 'USD' ? d?.priceUsd : d?.priceNaira,
        qty: d?.quantity,
        subtotal: d?.quantity * (origin?.sourceOrigin === '0' ? d?.priceUsd : d?.priceNaira),
        deliveryCost: generateDeliveryFee()

      })),
      totalSub: calculateTotal(),
      totalAmt: calculateGrandTotal(),
      paymentType: origin?.sourceOrigin === "0" ? 'USD' : 'NGN',
    }
    try {
      const result = await paymentService.initiate(data);
      if (result) {
        setIsLoading(false)
        setPaymentPage(true)
        setTimeout(() => {
          window.location.href = result.paystack.data?.authorization_url;

        }, 1400)

      }
      else {
        setIsLoading(false)
        toast({
          title: "Checkout",
          description: result?.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setIsLoading(false)
      toast({
        title: "Checkout",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    }
  }
  const formatCurrency = (
    amount: number | string,
    currency: "USD" | "NGN" | "EUR" | "CAD" = "USD",
    locale: string = "en-US"
  ): string => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(value)) return "0.00";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    const deliveryInfo = {
      name: formData?.fullName,
      email: formData?.email,
      phone: formData?.phone,
      address: formData?.deliveryAddress ? formData?.deliveryAddress : "USA",
    }

    const data = {
      deliveryInfo: deliveryInfo,
      user_id: sessionStorage?.getItem('4mtxxd'),
      user_email: sessionStorage?.getItem('4mtxxm'),
      currency: origin?.sourceOrigin === "0" ? 'USD' : 'NGN',
      orders: cartItems?.map((d) => ({
        prod_id: d?._id,
        prod_name: d?.name,
        moq: d?.moq,
        image: d?.imageUrls[0],
        price: currency === 'USD' ? d?.priceUsd : d?.priceNaira,
        qty: d?.quantity,
        subtotal: d?.quantity * (origin?.sourceOrigin === '0' ? d?.priceUsd : d?.priceNaira),
      })),
      totalAmt: calculateGrandTotal(),
      totalSub: calculateTotal(),
      paymentType: origin?.sourceOrigin === "0" ? 'USD' : 'NGN',
      deliveryCost: generateDeliveryFee()
    }
    try {
      const result = await paymentService.initiate(data);
      if (result) {
        setIsLoading(false)
        setPaymentPage(true)
        setTimeout(() => {
          window.location.href = result.paystack.data?.authorization_url;

        }, 1400)

      }
      else {
        setIsLoading(false)
        toast({
          title: "Checkout",
          description: result?.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setIsLoading(false)
      toast({
        title: "Checkout",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  const handleAddressValidation = (e: React.FormEvent) => {
    e?.preventDefault()
    const errors = validateForm(formData.phone, formData?.postalCode);
    if (Object.keys(errors).length > 0) {
      if (errors.phone) toast({
        title: "Checkout",
        description: errors?.phone,
        variant: "destructive",
      });
      if (origin?.sourceOrigin === "0") {
        if (errors.postalCode) toast({
          title: "Checkout",
          description: errors?.postalCode,
          variant: "destructive",
        });
      }

      return; // stop submission
    }

    if (address && country && postalcode) {
      validateAddress(address, postalcode, country);
    }
  }


  const handleAddressValidationGuest = (e: React.FormEvent) => {
    e?.preventDefault()
    const errors = validateForm(guestData.phone, guestData?.postalCode);

    console.log(errors)

    if (Object.keys(errors).length > 0) {

      if (errors.phone) toast({
        title: "Checkout",
        description: errors?.phone,
        variant: "destructive",
      });
      if (origin?.sourceOrigin === "0") {
        if (errors.postalCode) toast({
          title: "Checkout",
          description: errors?.postalCode,
          variant: "destructive",
        });
      }

      return; // stop submission
    }

    if (address && country) {
      validateAddress(address, postalcode, country);
    }
  }






  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Shopping Cart </h1>
          <p className="text-slate-600">Review your items and proceed to checkout </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                      <div className="sm:col-span-2 flex items-center space-x-4">
                        <img
                          src={item.imageUrls[0]}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{item.name}</h3>
                          {origin?.sourceOrigin !== "" &&
                            <p className="text-primary-600 font-bold text-sm sm:text-base mt-1">
                              {origin?.sourceOrigin === "1" ? '₦' : '$'}{origin?.sourceOrigin === "1" ? item?.priceNaira : item.priceUsd} each
                            </p>}
                          <p className="text-primary-600 font-bold text-sm sm:text-base mt-1">
                            MOQ: {item?.moq}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-2">
                        {item?.moq < item.quantity &&
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityDecrease(item._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>}
                        <span className="mx-3 font-medium w-8 text-center">{item.quantity}</span>
                        {item?.quantity < item?.stock &&
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityIncrease(item._id)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end">
                        <p className="font-bold text-slate-900">
                          {origin?.sourceOrigin === "0"
                            ? `$${(parseFloat(item.priceUsd) * item.quantity).toFixed(2)}`
                            : `₦${(parseFloat(item.priceNaira) * item.quantity).toLocaleString()}`
                          }
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemUpdate(item._id)}
                          className="text-red-600 hover:text-red-700 ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Currency</label>
                  <div className="flex space-x-2">
                    <Button
                      variant={origin?.sourceOrigin === '0' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                    >
                      USD ($)
                    </Button>
                    <Button
                      variant={origin?.sourceOrigin === "1" ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                    >
                      NGN (₦)
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">
                      {origin?.sourceOrigin === "0"
                        ? `$${calculateTotal().toFixed(2)}`
                        : `₦${calculateTotal().toLocaleString()}`
                      }
                    </span>
                  </div>

                </div>

                <div className="space-y-3">

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 shadow-lg" onClick={proceedPayment}>
                        Proceed to Checkout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Delivery Information </DialogTitle>
                      </DialogHeader>
                      {sessionStorage?.getItem('4mttoken') ?
                        <form onSubmit={handleAddressValidation} className="space-y-6">

                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                              Full Name
                            </label>
                            <Input
                              id="fullName"
                              name="fullName"
                              type="text"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              required
                              className="w-full"
                              placeholder="Full Name"
                            />
                          </div>

                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                              Email Address
                            </label>
                            <div className="relative">
                              <Input
                                id="email"
                                name="email"
                                type={"email"}
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full pr-12"
                                placeholder="Email Address"
                              />

                            </div>
                          </div>
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                              Phone Number
                            </label>
                            <div className="relative">
                              <Input
                                id="phone"
                                name="phone"
                                type={"text"}
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                className="w-full pr-12"
                                placeholder="Phone Number"
                              />

                            </div>
                          </div>
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                              Delivery Address
                            </label>
                            <Input
                              id="deliveryAddress"
                              name="deliveryAddress"
                              type={"text"}
                              value={formData.deliveryAddress}
                              onChange={handleInputChange}
                              required
                              className="w-full pr-12"
                              placeholder={origin?.sourceOrigin === "0" ? "2212 Bellewood street Dart,North Carolina, USA" : "100024 Greg coker street,Ikeja, Lagos Nigeria"}
                            />

                          </div>
                          {origin?.sourceOrigin === "0" &&
                            <div>
                              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Postal Code
                              </label>
                              <div className="relative">
                                <Input
                                  id="postalCode"
                                  name="postalCode"
                                  type={"text"}
                                  value={formData.postalCode}
                                  onChange={handleInputChange}
                                  required
                                  className="w-full pr-12"
                                  placeholder="Postal Code"
                                />

                              </div>
                            </div>}
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                              Country
                            </label>
                            <div className="relative">
                              {origin?.sourceOrigin === "0" ?
                                <div className="relative">
                                  <Select
                                    value={formData.country}
                                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                                    required
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {['USA', 'CANADA', 'NETHERLANDS']?.map((cont) => (
                                        <SelectItem key={cont} value={cont}>
                                          {cont}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                </div> :
                                <div>
                                  <div className="relative">
                                    <Select
                                      value={formData.country}
                                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                                      required
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a country" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {['NIGERIA']?.map((cont) => (
                                          <SelectItem key={cont} value={cont}>
                                            {cont}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                  </div>
                                </div>}

                            </div>
                          </div>


                          <Button
                            type="submit"
                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 font-semibold shadow-lg"
                          >
                            {isLoading ? 'Submitting...' : 'Complete'}
                          </Button>
                        </form> :
                        <div>
                          {guestForm ?
                            <div>

                              <form onSubmit={handleAddressValidationGuest} className="space-y-6">
                                <div>
                                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name
                                  </label>
                                  <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={guestData.fullName}
                                    onChange={handleInputChangeGuest}
                                    required
                                    className="w-full"
                                    placeholder="Full Name"
                                  />
                                </div>

                                <div>
                                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                  </label>
                                  <div className="relative">
                                    <Input
                                      id="email"
                                      name="email"
                                      type={"email"}
                                      value={guestData.email}
                                      onChange={handleInputChangeGuest}
                                      required
                                      className="w-full pr-12"
                                      placeholder="Email Address"
                                    />

                                  </div>
                                </div>
                                <div>
                                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                  </label>
                                  <div className="relative">
                                    <Input
                                      id="phone"
                                      name="phone"
                                      type={"text"}
                                      value={guestData.phone}
                                      onChange={handleInputChangeGuest}
                                      required
                                      className="w-full pr-12"
                                      placeholder="Phone Number"
                                    />

                                  </div>
                                </div>
                                <div>
                                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Delivery Address
                                  </label>
                                  <Input
                                    id="deliveryAddress"
                                    name="deliveryAddress"
                                    type={"text"}
                                    value={guestData.deliveryAddress}
                                    onChange={handleInputChangeGuest}
                                    required
                                    className="w-full pr-12"
                                    placeholder={origin?.sourceOrigin === "0" ? "2212 Bellewood street Dart,North Carolina, USA" : "100024 Greg coker street,Ikeja, Lagos Nigeria"}
                                  />

                                </div>
                                {origin?.sourceOrigin === '0' &&
                                  <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                      Postal Code
                                    </label>
                                    <div className="relative">
                                      <Input
                                        id="postalCode"
                                        name="postalCode"
                                        type={"text"}
                                        value={guestData.postalCode}
                                        onChange={handleInputChangeGuest}
                                        className="w-full pr-12"
                                        required
                                        placeholder="Postal Code"
                                      />
                                    </div>
                                  </div>}
                                <div>
                                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Country
                                  </label>
                                  {origin?.sourceOrigin === "0" ?
                                    <div className="relative">
                                      <Select
                                        value={guestData.country}
                                        onValueChange={(value) => setGuestData({ ...guestData, country: value })}
                                        required
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {['USA', 'CANADA', 'NETHERLANDS']?.map((cont) => (
                                            <SelectItem key={cont} value={cont}>
                                              {cont}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                    </div> :
                                    <div>
                                      <div className="relative">
                                        <Select
                                          value={guestData.country}
                                          onValueChange={(value) => setGuestData({ ...guestData, country: value })}
                                          required
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a country" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {['NIGERIA']?.map((cont) => (
                                              <SelectItem key={cont} value={cont}>
                                                {cont}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>

                                      </div>
                                    </div>}
                                </div>


                                <div>
                                </div>
                                <Button
                                  type="submit"
                                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 font-semibold shadow-lg"
                                >
                                  Proceed
                                </Button>
                              </form>
                            </div> :
                            <div className="container py-5">
                              <h5 className="pt-3 font-weight-bold"><span className="text-danger">NB: {" "}</span>We have detected that you are not logged in or don't have an account with us</h5>
                              <br />
                              <form onSubmit={handleSubmitGuest} className="space-y-6">
                                <Radio.Group
                                  style={style}
                                  onChange={onChange}
                                  value={radioValue}
                                  options={[
                                    {
                                      value: 1,
                                      label: 'Do you want to proceed to pay for this product as a guest user that does not have an account with 4marketdays?',
                                    },
                                    {
                                      value: 2,
                                      label: 'Login an existing account and complete purchase so we can add this to your purchase records',
                                    },
                                    {
                                      value: 3,
                                      label: 'Register an new account , so you can always come back to buy easily and see your purchase records',
                                    },

                                  ]}
                                />
                                <Button
                                  type="submit"
                                  disabled={isLoading}
                                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 font-semibold shadow-lg"
                                >
                                  Proceed
                                </Button>
                              </form>
                            </div>}
                        </div>}


                    </DialogContent>
                  </Dialog>
                  <br />
                  <Link href="/products" className={"mt-5"}>
                    <Button variant="outline" className="w-full" style={{ marginTop: '1rem' }}>
                      Continue Shopping
                    </Button>
                  </Link>
                </div>


              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        title="Cart Details"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={openCartDetails}
        width={500}
        footer={false}
        onCancel={() => {
          setOpenCardDetails(false)
          setOpenPaymentDetails(true)
          setFormData({
            email: '',
            deliveryAddress: '',
            fullName: sessionStorage?.getItem('4mtfname') ? sessionStorage?.getItem('4mtfname') : "",
            phone: "",
            postalCode: "",
            country: ""
          });
          setStatus("")
          setGuestData({
            email: '',
            deliveryAddress: '',
            fullName: "",
            phone: "",
            postalCode: "",
            country: ""
          })

        }
        }
        maskClosable={false}
      >
        <div>
          <div>
            {paymentPage &&
              <p className="p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
                <strong>🎉 Order Submitted Successfully.</strong> We will be redirecting you to a payment page to complete your order purchase.
              </p>}
            <br />
            <div className="flex justify-between mb-3">
              <h4 className="">Cart Subtotal Amount</h4>
              <h4 className="font-medium text-green-600">
                {formatCurrency(calculateTotal(), country !== 'NIGERIA' ? "USD" : "NGN")}
              </h4>
            </div>
            <div className="flex justify-between mb-3">
              <h4 className="">Delivery Cost</h4>
              <h4 className="font-medium text-green-600">
                {formatCurrency(generateDeliveryFee(), country !== 'NIGERIA' ? "USD" : "NGN")}
              </h4>
            </div>
            <div className="flex justify-between mb-3">
              <h4 className="">Grand Total</h4>
              <h4 className="font-medium text-green-600">
                {formatCurrency(calculateGrandTotal(), country !== 'NIGERIA' ? "USD" : "NGN")}
              </h4>
            </div>
            <div className="flex justify-between">
              <h4 className="">Payable Amount </h4>
              <h4 className="font-medium text-green-600">
                {formatCurrency(calculateGrandTotal(), country !== 'NIGERIA' ? "USD" : "NGN")}
              </h4>
            </div>
          </div>
        </div>
        <br />
        <Button
          type="submit"
          disabled={isLoading}
          onClick={sessionStorage?.getItem('4mttoken') ? handleSubmit : handleGuestPay}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 font-semibold shadow-lg"
        >
          Complete Payment
        </Button>
      </Modal>

      <Footer />
    </div>
  );
}
