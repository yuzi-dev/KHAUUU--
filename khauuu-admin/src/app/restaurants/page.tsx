'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { restaurantApi } from '@/lib/api/restaurants'
import { Restaurant } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    loadRestaurants()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRestaurants(filtered)
    } else {
      setFilteredRestaurants(restaurants)
    }
  }, [searchQuery, restaurants])

  const loadRestaurants = async () => {
    try {
      setLoading(true)
      const data = await restaurantApi.getAll()
      setRestaurants(data)
    } catch (error) {
      console.error('Error loading restaurants:', error)
      toast.error('Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await restaurantApi.delete(id)
      toast.success('Restaurant deleted successfully')
      loadRestaurants()
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error('Failed to delete restaurant')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Restaurants</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading restaurants...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-600">Manage restaurants in your platform</p>
        </div>
        <Link href="/restaurants/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Restaurant
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find restaurants by name, cuisine, or location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Restaurants ({filteredRestaurants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No restaurants found matching your search.' : 'No restaurants found.'}
              </p>
              {!searchQuery && (
                <Link href="/restaurants/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Restaurant
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cuisine</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{restaurant.name}</p>
                        {restaurant.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {restaurant.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{restaurant.cuisine}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {restaurant.location_name || restaurant.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                          {restaurant.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {restaurant.is_verified && (
                          <Badge variant="outline">Verified</Badge>
                        )}
                        {restaurant.is_featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1">({restaurant.review_count})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(restaurant.created_at)}
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
                            <Link href={`/restaurants/${restaurant.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/restaurants/${restaurant.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(restaurant.id, restaurant.name)}
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