'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Filter } from 'lucide-react'
import { foodApi } from '@/lib/api/foods'
import { restaurantApi } from '@/lib/api/restaurants'
import { Food, Restaurant } from '@/types/database'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function FoodsPage() {
  const searchParams = useSearchParams()
  const [foods, setFoods] = useState<Food[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(searchParams.get('restaurant') || 'all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([])

  const categories = [
    'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Snack', 'Soup', 'Salad', 'Side Dish'
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterFoods()
  }, [searchQuery, selectedRestaurant, selectedCategory, foods])

  const loadData = async () => {
    try {
      setLoading(true)
      const [foodsData, restaurantsData] = await Promise.all([
        foodApi.getAll(),
        restaurantApi.getAll()
      ])
      setFoods(foodsData)
      setRestaurants(restaurantsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filterFoods = () => {
    let filtered = foods

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by restaurant
    if (selectedRestaurant !== 'all') {
      filtered = filtered.filter(food => food.restaurant_id === selectedRestaurant)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(food => food.category === selectedCategory)
    }

    setFilteredFoods(filtered)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await foodApi.delete(id)
      toast.success('Food item deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting food:', error)
      toast.error('Failed to delete food item')
    }
  }

  const getRestaurantName = (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId)
    return restaurant?.name || 'Unknown Restaurant'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Food Items</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading food items...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Food Items</h1>
          <p className="text-gray-600">Manage food items across all restaurants</p>
        </div>
        <Link href="/foods/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Food Item
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find food items by name, restaurant, or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger>
                <SelectValue placeholder="All Restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('')
                setSelectedRestaurant('all')
                setSelectedCategory('all')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Foods Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Food Items ({filteredFoods.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFoods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery || selectedRestaurant !== 'all' || selectedCategory !== 'all' 
                  ? 'No food items found matching your filters.' 
                  : 'No food items found.'}
              </p>
              {!searchQuery && selectedRestaurant === 'all' && selectedCategory === 'all' && (
                <Link href="/foods/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Food Item
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFoods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{food.name}</p>
                        {food.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {food.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/restaurants/${food.restaurant_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {getRestaurantName(food.restaurant_id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{food.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatPrice(food.price)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={food.is_available ? "default" : "secondary"}>
                          {food.is_available ? "Available" : "Unavailable"}
                        </Badge>
                        {food.is_vegetarian && (
                          <Badge variant="outline" className="text-green-600">Veg</Badge>
                        )}
                        {food.is_featured && (
                          <Badge variant="outline" className="text-yellow-600">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{food.rating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1">({food.review_count})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(food.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/foods/${food.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/foods/${food.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(food.id, food.name)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}