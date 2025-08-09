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
import { Input } from "@/components/ui/input";
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
import { Plus, Package, Edit, Trash2 } from "lucide-react";
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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceUsd: "",
    priceNaira: "",
    category: "",
    status:false,
    moq: 0,
    nutritionalInfo:"",
    storageInstructions:"",
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
      status:false,
      nutritionalInfo:"",
      storageInstructions:"",
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

  const { data: customers, isLoading: customerLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/admin/customers"],
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




  // const handleDelete = (id: string) => {
  //   if (confirm("Are you sure you want to delete this product?")) {
  //     deleteMutation.mutate(id);
  //   }
  // };

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
            <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
            <p className="text-gray-600">Manage your customers base</p>
          </div>

        
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers Management</CardTitle>
          </CardHeader>
          <CardContent>
            {customerLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : customers?.customers?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Email Verified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.customers?.map((product: Product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={product?.image}
                            alt={product.image}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.firstName + " " +  product?.lastName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.email}</TableCell>
                      <TableCell>{product.phoneNumber}</TableCell>

                      <TableCell>
                        <Badge variant={product.isVerified  ? "default" : "secondary"}>
                          {product.isVerified ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isDisabled  ? "default" : "secondary"}>
                          {product.isDisabled ? "Inactive" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
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
                <p>No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>

       
      </div>
    </AdminLayout>
  );
}
