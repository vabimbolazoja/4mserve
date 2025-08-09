import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";
import SingleImageUploader from "@/components/ui/uploadSingle"
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
    const [imageUrlView,setImageurlView] = useState("")
    const [imageUrl, setImageUrl] = useState<string[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: ""
    });

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            image: ""
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



    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => apiRequest("POST", "/api/admin/category", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
            toast({
                title: "Success",
                description: "Category created successfully",
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

    const handleUploadComplete = (url: string) => {
        setFormData({ ...formData, image: url })
        setImageUrl(url)
        setImageurlView("")

    };

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
            apiRequest("PUT", `/api/admin/category/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
            setEditingProduct(null);
            resetForm();
            toast({
                title: "Success",
                description: "Category updated successfully",
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
        mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/category/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
            toast({
                title: "Success",
                description: "Cateogory deleted successfully",
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
        setImageurlView(product?.image)
        setFormData({
            name: product.name,
            description: product.description,
            image: product.image,
            status: product?.status === 'Active' ? true : false,
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
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
                        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                        <p className="text-gray-600">Manage your product categories</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent customWidth="900px">
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                                <DialogDescription>
                                    Create a new category for your store.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>


                                <div>
                                    <Label htmlFor="category">Image</Label>
                                    <SingleImageUploader onUploadComplete={handleUploadComplete} />
                                 
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Creating..." : "Create Category"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : products?.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products?.map((product: Product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{product.description}</TableCell>

                                            <TableCell>
                                                <Badge variant={product.status === 'Active' ? "default" : "secondary"}>
                                                    {product.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(product._id)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                                <p>No Category found</p>
                                <p className="text-sm">Add your first category to get started</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                    <DialogContent customWidth="900px">
                        <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                            <DialogDescription>
                                Update category information.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="imageUrl">Image</Label>
                                <SingleImageUploader onUploadComplete={handleUploadComplete} />
                                {imageUrlView && (
                                    <div style={{ marginTop: 20 }}>
                                        <h4>Uploaded Image:</h4>
                                        <img
                                            src={imageUrlView}
                                            alt="Uploaded"
                                            width={200}
                                            style={{ borderRadius: 8, border: "1px solid #ccc" }}
                                        />
                                    </div>
                                )}

                            </div>
                            <div>
                                <div>
                                    <Label htmlFor="imageUrl">Category Status</Label>
                                </div>
                                <div>
                                    <Switch size="small" value={formData?.status} value={formData?.status} onChange={switchChange} />
                                </div>

                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Updating..." : "Update Category"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
