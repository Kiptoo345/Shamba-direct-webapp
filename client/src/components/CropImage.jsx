const CROP_IMAGES = [
  { file: 'tomatoes.jpg', names: ['tomato', 'tomatoes'] },
  { file: 'maize.jpg', names: ['maize', 'corn'] },
  { file: 'potatoes.jpg', names: ['potato', 'potatoes'] },
  { file: 'onions.jpg', names: ['onion', 'onions'] },
  { file: 'beans.jpg', names: ['bean', 'beans'] },
  { file: 'kales.jpg', names: ['kale', 'kales', 'sukuma wiki'] },
  { file: 'rice.jpg', names: ['rice'] },
  { file: 'bananas.jpg', names: ['banana', 'bananas', 'ndizi', 'plantain'] }
];

function findCropImage(name, category) {
  const cropDescription = `${name || ''} ${category || ''}`.toLowerCase();
  const crop = CROP_IMAGES.find(({ names }) =>
    names.some((cropName) => cropDescription.includes(cropName))
  );

  return crop ? `/images/${crop.file}` : null;
}

function CropImage({ name, category }) {
  const image = findCropImage(name, category);

  if (!image) {
    return (
      <div className="produce-img-placeholder" role="img" aria-label={`Image unavailable for ${name}`}>
        {name}
      </div>
    );
  }

  return <img src={image} alt={name} loading="lazy" />;
}

export default CropImage;
