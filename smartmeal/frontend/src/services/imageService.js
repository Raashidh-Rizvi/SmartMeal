export const getFoodImage = (foodName) => {
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(foodName)},food`;
};
