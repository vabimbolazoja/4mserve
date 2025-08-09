import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, CreditCard, Truck, Eye, MapPin, Phone, Mail, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from 'antd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import MultiUpload from "../components/ui/multiupload"
interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stock: number;
  isActive: boolean;
}

export default function Products() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceUsd: "",
    priceNaira: "",
    category: "",
    status: false,
    moq: 0,
    nutritionalInfo: "",
    storageInstructions: "",
    imageUrls: [],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: 0,
      imageUrls: "",
      status: false,
      nutritionalInfo: "",
      storageInstructions: "",
    });
  };


  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: products, isLoading: productsLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/admin/orders"],
    retry: false,
  });

  const { data: categories, isLoading: categoryLoading, error: erroCats } = useQuery<Product[]>({
    queryKey: ["/api/admin/categories"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  useEffect(() => {
    if (isAddDialogOpen) {
      resetForm()
    }
  }, [isAddDialogOpen])

  const getStatusColor = (status:any) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';

      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status:any) => {
    switch (status) {
      case 'DELIVERED':
      case 'PAID':
      case 'SHIPPED':
      case 'PROCESSING':
      case 'PENDING':
      default:
    }
  };



  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/admin/product", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();

    },
    onError: (error) => {
      console.log(error)
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      apiRequest("PUT", `/api/admin/product/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      resetForm();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {

      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/product/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    },
  });


  const switchChange = (val) => {
    setFormData({ ...formData, status: val })

  }


  const handleUploadComplete = (urls: string[]) => {
    setImageUrls(urls)
    setFormData({ ...formData, imageUrls: urls })
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setOrder(product)

  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }




  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
            <p className="text-gray-600">Manage your customer product orders</p>
          </div>

        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders List</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : products?.orders?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.orders?.map((product: Product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.ref}</TableCell>

                      <TableCell>{product.userEmail}</TableCell>
                      <TableCell>{product?.paymentType === 'NGN' ? 'N' : '$'}{product.totalAmt}</TableCell>

                      <TableCell>
                        <Badge variant={product.paymentStatus === 'PAID' ? "default" : "secondary"}>
                          {product.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                      <Badge variant={product.orderStatus === 'DELIVERED' ? "default" : "secondary"}>
                      {product.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{product?.date}</TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            More
                          </Button>


                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto mb-4" size={48} />
                <p>No products found</p>
                <p className="text-sm">Add your first product to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order {editingProduct?.ref}</DialogTitle>
              <DialogDescription>
                Order Details information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${getStatusColor(order?.orderStatus)}`}>
                      <div className="flex items-center">
                        {getStatusIcon(order?.orderStatus)}
                        <span className="ml-1 capitalize">{order?.orderStatus}</span>
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Order placed on {new Date(order?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Items Ordered</h3>
                <div className="space-y-4">
                  {order?.orders.map((item) => (
                    <div key={item.prod_id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.prod_name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{item.prod_name}</h4>
                        <p className="text-sm text-slate-600">Quantity: {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {order.paymentType === 'USD' ? '$' : '₦'}{item.price}
                        </p>
                        <p className="text-sm text-slate-600">each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">
                        {order?.paymentType === 'USD' ? '$' : '₦'}{order?.totalAmt || order?.totalAmt}
                      </span>
                    </div>

                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{order?.paymentType === 'USD' ? '$' : '₦'}{order?.totalAmt}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Payment Method</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{'Credit Card'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Customer Information</h3>
                  {order?.deliveryInfo && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-600" />
                        <span className="text-slate-600">{order?.deliveryInfo.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-600" />
                        <span className="text-slate-600">{order?.deliveryInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-600" />
                        <span className="text-slate-600">{order?.deliveryInfo.phone}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Shipping Address</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">{order?.deliveryInfo?.address}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="mt-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Delivery Details</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">Rider Name - {order?.rider ?? 'NA'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">Expected Delivery Date- {order?.expectedDate ?? 'na'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">Current Location- {order?.location ?? 'na'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">Status- {order?.orderStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
