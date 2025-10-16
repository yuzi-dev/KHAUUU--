const { foodService } = require('./lib/services/foods.ts');

async function testFixedGetPopular() {
  console.log('Testing fixed getPopular function...');
  
  try {
    const popularFoods = await foodService.getPopular(5);
    
    console.log('getPopular() result:');
    console.log('- Found', popularFoods?.length || 0, 'popular foods');
    
    if (popularFoods && popularFoods.length > 0) {
      console.log('- Sample food:', {
        id: popularFoods[0].id,
        name: popularFoods[0].name,
        is_featured: popularFoods[0].is_featured,
        is_available: popularFoods[0].is_available,
        restaurant: popularFoods[0].restaurant ? {
          id: popularFoods[0].restaurant.id,
          name: popularFoods[0].restaurant.name,
          cuisine: popularFoods[0].restaurant.cuisine
        } : 'No restaurant data'
      });
      
      console.log('✅ getPopular function is working correctly!');
    } else {
      console.log('⚠️  No popular foods returned, but no error occurred');
    }
    
  } catch (error) {
    console.error('❌ Error testing getPopular:', error);
  }
}

testFixedGetPopular();