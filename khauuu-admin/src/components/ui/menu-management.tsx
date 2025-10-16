'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Menu, CreateMenuData } from '@/types/database'

interface MenuManagementProps {
  restaurantId: string
  initialMenuItems?: Menu[]
  onMenuItemsChange?: (items: Menu[]) => void
}

const FOOD_CATEGORIES = [
  'Appetizers', 'Soups', 'Salads', 'Main Course', 'Pasta', 'Pizza', 
  'Seafood', 'Meat', 'Vegetarian', 'Desserts', 'Beverages', 'Specials'
] as const

export function MenuManagement({ 
  restaurantId, 
  initialMenuItems = [], 
  onMenuItemsChange 
}: MenuManagementProps) {
  const [menuItems, setMenuItems] = useState<Menu[]>(initialMenuItems)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<CreateMenuData>({
    restaurant_id: restaurantId,
    name: '',
    description: '',
    price: 0,
    category: '',
    is_available: true,
    images: []
  })

  useEffect(() => {
    setMenuItems(initialMenuItems)
  }, [initialMenuItems])

  const stableOnMenuItemsChange = useCallback(onMenuItemsChange || (() => {}), [])

  useEffect(() => {
    if (stableOnMenuItemsChange) {
      stableOnMenuItemsChange(menuItems)
    }
  }, [menuItems, stableOnMenuItemsChange])

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || newItem.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    const item: Menu = {
      ...newItem,
      id: `temp-${Date.now()}`, // Temporary ID for new items
      is_available: newItem.is_available ?? true, // Ensure is_available is always boolean
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setMenuItems(prev => [...prev, item])
    setNewItem({
      restaurant_id: restaurantId,
      name: '',
      description: '',
      price: 0,
      category: '',
      is_available: true,
      images: []
    })
    setIsAddingItem(false)
    toast.success('Menu item added successfully')
  }

  const handleEditItem = (item: Menu) => {
    setEditingItemId(item.id || null)
    setNewItem({
      restaurant_id: item.restaurant_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || '',
      is_available: item.is_available,
      images: item.images || []
    })
  }

  const handleSaveEdit = () => {
    if (!newItem.name || !newItem.category || newItem.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setMenuItems(prev => 
      prev.map(item => 
        item.id === editingItemId ? { 
          ...item,
          ...newItem,
          id: editingItemId,
          updated_at: new Date().toISOString()
        } : item
      )
    )
    setEditingItemId(null)
    setNewItem({
      restaurant_id: restaurantId,
      name: '',
      description: '',
      price: 0,
      category: '',
      is_available: true,
      images: []
    })
    toast.success('Menu item updated successfully')
  }

  const handleDeleteItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId))
    toast.success('Menu item deleted successfully')
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, Menu[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Menu Management</h3>
          <p className="text-sm text-gray-600">Add and manage menu items for this restaurant</p>
        </div>
        <Button 
          onClick={() => setIsAddingItem(true)}
          disabled={isAddingItem || editingItemId !== null}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingItem || editingItemId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItemId ? 'Edit Menu Item' : 'Add New Menu Item'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name *</Label>
                <Input
                  id="item-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category *</Label>
                <Select 
                  value={newItem.category} 
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the menu item..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price (Rs.) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="is-available"
                  checked={newItem.is_available}
                  onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, is_available: !!checked }))}
                />
                <Label htmlFor="is-available">Available</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingItem(false)
                  setEditingItemId(null)
                  setNewItem({
                    restaurant_id: restaurantId,
                    name: '',
                    description: '',
                    price: 0,
                    category: '',
                    is_available: true,
                    images: []
                  })
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={editingItemId ? handleSaveEdit : handleAddItem}>
                <Save className="h-4 w-4 mr-2" />
                {editingItemId ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items Display */}
      <div className="space-y-6">
        {Object.keys(groupedItems).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No menu items added yet. Click "Add Menu Item" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>{items.length} item(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <span className="font-semibold text-green-600">Rs. {item.price}</span>
                          {!item.is_available && (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          disabled={isAddingItem || editingItemId !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id!)}
                          disabled={isAddingItem || editingItemId !== null}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}