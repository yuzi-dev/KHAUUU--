// Debug script to test review fetching in browser console
// Copy and paste this into the browser console on the restaurant page

console.log('Starting review debug...');

// Test the review service directly
const testReviewFetch = async () => {
  try {
    const restaurantId = 'a5cd0d41-9941-4c3c-a703-b5d9afb2e695';
    console.log('Testing review fetch for restaurant:', restaurantId);
    
    // Check if we can access the review service
    if (typeof reviewService !== 'undefined') {
      console.log('reviewService is available');
      const reviews = await reviewService.getReviews({ restaurant_id: restaurantId });
      console.log('Direct service call result:', reviews);
    } else {
      console.log('reviewService not available in global scope');
    }
    
    // Check the current reviews state
    console.log('Current page reviews state:', window.React?.useState);
    
    // Check if there are any network requests for reviews
    console.log('Check Network tab for review-related API calls');
    
  } catch (error) {
    console.error('Error in debug test:', error);
  }
};

testReviewFetch();