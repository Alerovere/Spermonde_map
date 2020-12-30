// Code by A. Rovere (MARUM, University of Bremen), with snippets and help from the following sources:
// https://code.earthengine.google.com/6051c2f82cdd96b1471f9a26d4210e99
// https://developers.google.com/earth-engine/guides/classification
// https://gis.stackexchange.com/questions/182410/how-can-i-change-the-labels-in-the-console-output-in-google-earth-engine
// https://gis.stackexchange.com/questions/337358/histogram-of-classified-image-in-google-earth-engine
// https://gis.stackexchange.com/questions/298371/preventing-google-earth-engine-exporting-image-with-black-border

// Start of code
// The following clipping geometry was created Earth Engine developer interface
var geometry = 
    /* color: #ffc82d */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[119.5427976096379, -4.215033256878309],
          [119.1692624533879, -4.215033256878309],
          [119.15552954323165, -4.346501375344678],
          [119.11707739479415, -4.486161117421803],
          [119.07862524635665, -4.62579415542142],
          [118.9055905783879, -4.634007014308701],
          [118.8836179221379, -4.710655740063683],
          [118.9055905783879, -4.776347928722391],
          [118.9165769065129, -4.842033824577697],
          [118.9660153830754, -4.891294065249019],
          [118.99485449440353, -4.977490744270858],
          [119.0264401877629, -5.077355299786198],
          [119.04429297096603, -5.219601311125961],
          [119.03879980690353, -5.290712276034151],
          [119.03330664284103, -5.370018706556156],
          [119.03812337884533, -5.559305996400937],
          [119.31827474603283, -5.581174896545333],
          [119.36771322259533, -5.537436283779267],
          [119.32651449212658, -5.441746816975736],
          [119.30179525384533, -5.29408186483127],
          [119.33750082025158, -5.236647026262798],
          [119.36771322259533, -5.132703943056422],
          [119.42264486322033, -4.995910973103267],
          [119.44736410150158, -4.900138857540924],
          [119.43360241294714, -4.8375761799007595],
          [119.43909557700964, -4.745887275430393],
          [119.48166759849401, -4.666504944308245],
          [119.51462658286901, -4.591220299493239]]]);

// Browse SENTINEL2 data an query them
var image = ee.ImageCollection('COPERNICUS/S2') // searches all sentinel 2 imagery pixels...
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10)) // filters on the metadata for pixels less than 10% cloud
  .filterDate('2020-01-1' ,'2020-10-11') // chooses only pixels between the dates you define here
  .filterBounds(geometry); // that are within your aoi
  
print(image); // generates a JSON list of the images (and their metadata) which the filters found in the right-hand window.
  
var medianpixels = image.median(); // finds the median value of all the pixels which meet the criteria. 
var medianpixelsclipped = medianpixels.clip(geometry).divide(10000); // cuts up the result so that it fits neatly into your aoi
                                                                  // and divides so that values between 0 and 1

// input bands for classification. Here we use R,G,B, and NIR
var bands = ['B2', 'B3', 'B4', 'B8'];

// Import training data obtained from Pleiades imagery analysed with Trimble ECognition
// The data consists of a shapefile with two attributes: 'label' and 'Class_name'
var shape = ee.FeatureCollection('users/alessioroverephd/training');

// Get the values for all pixels in each polygon in the training.
var training = medianpixelsclipped.sampleRegions({
  collection: shape,
  properties: ['label'],
  scale: 10,
  tileScale: 2});

// loading min distance classifier
var classifier = ee.Classifier.minimumDistance();	
// Train the classifier.
var trained = classifier.train(training, 'label', bands);

// Classify the image and remove deepwater pixels
var classified = medianpixelsclipped.classify(trained);
var mask = classified.neq(4); // create a mask for crops
var class_clip = classified.mask(mask); // mask it

// Add visualizazion 
Map.centerObject(medianpixelsclipped, 9);
Map.addLayer(medianpixelsclipped, {bands: ['B8', 'B3', 'B2'], min: 0, max: 1, gamma: 1.5}, 'Sentinel_2 mosaic');
Map.addLayer(class_clip,{min: 0, max: 5},'classes');

// Remap the classified image to avoid NoData mapped as '0'
var remap = ee.Image(class_clip)
 .remap([0,1,2,3,5], [1,2,3,4,5]);

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: remap,
  description: 'EE_mindist_10m',
  region: geometry,
  scale: 20,
  skipEmptyTiles: 'True',
  fileFormat: 'GeoTiff'
});

// Generate charts
// Generate histogram for buildings
var buildings = class_clip.eq(5);
buildings     = buildings.selfMask()
buildings = buildings.addBands(medianpixelsclipped).select(bands).updateMask(buildings)

// Pre-define some customization options.
var options = {
  title: 'Built environment',
  fontSize: 20,
  hAxis: {title: 'DN'},
  vAxis: {title: 'count of DN'},
  series: {
    0: {color: 'Blue'},
    1: {color: 'Green'},
    2: {color: 'Red'},
    3: {color: 'Magenta'}}};
// Make the histogram, set the options.
var building_hist = ui.Chart.image.histogram(buildings, geometry, 100)
    .setSeriesNames(['Blue', 'Green', 'Red', 'NIR'])
    .setOptions(options);
// print histogram
print(building_hist);

// Generate histogram for vegetation
var vegetation = class_clip.eq(0);
vegetation = vegetation.selfMask()
vegetation = vegetation.addBands(medianpixelsclipped).select(bands).updateMask(vegetation)
// Pre-define some customization options.
var options = {
  title: 'Vegetation',
  fontSize: 20,
  hAxis: {title: 'DN'},
  vAxis: {title: 'count of DN'},
  series: {
    0: {color: 'Blue'},
    1: {color: 'Green'},
    2: {color: 'Red'},
    3: {color: 'Magenta'}}};
// Make the histogram, set the options.
var vegetation_hist = ui.Chart.image.histogram(vegetation, geometry, 100)
    .setSeriesNames(['Blue', 'Green', 'Red', 'NIR'])
    .setOptions(options);
// print histogram
print(vegetation_hist);

// Generate histogram for shallow underwater reef/sands
var undw_sand = class_clip.eq(1);
undw_sand = undw_sand.selfMask()
undw_sand = undw_sand.addBands(medianpixelsclipped).select(bands).updateMask(undw_sand)
// Pre-define some customization options.
var options = {
  title: 'Shallow-water sand/reef complex',
  fontSize: 20,
  hAxis: {title: 'DN'},
  vAxis: {title: 'count of DN'},
  series: {
    0: {color: 'Blue'},
    1: {color: 'Green'},
    2: {color: 'Red'},
    3: {color: 'Magenta'}}};
// Make the histogram, set the options.
var undw_sand_hist = ui.Chart.image.histogram(undw_sand, geometry, 100)
    .setSeriesNames(['Blue', 'Green', 'Red', 'NIR'])
    .setOptions(options);
// print histogram
print(undw_sand_hist);

// Generate histogram for beach sands
var sand = class_clip.eq(2);
sand = sand.selfMask()
sand = sand.addBands(medianpixelsclipped).select(bands).updateMask(sand)
// Pre-define some customization options.
var options = {
  title: 'Beach sands',
  fontSize: 20,
  hAxis: {title: 'DN'},
  vAxis: {title: 'count of DN'},
  series: {
    0: {color: 'Blue'},
    1: {color: 'Green'},
    2: {color: 'Red'},
    3: {color: 'Magenta'}}};
// Make the histogram, set the options.
var sand_hist = ui.Chart.image.histogram(sand, geometry, 100)
    .setSeriesNames(['Blue', 'Green', 'Red', 'NIR'])
    .setOptions(options);
// print histogram
print(sand_hist);

// Generate histogram for reef
var reef = class_clip.eq(3);
reef = reef.selfMask()
reef = reef.addBands(medianpixelsclipped).select(bands).updateMask(sand)
// Pre-define some customization options.
var options = {
  title: 'Shallow-water reef',
  fontSize: 20,
  hAxis: {title: 'DN'},
  vAxis: {title: 'count of DN'},
  series: {
    0: {color: 'Blue'},
    1: {color: 'Green'},
    2: {color: 'Red'},
    3: {color: 'Magenta'}}};
// Make the histogram, set the options.
var reef_hist = ui.Chart.image.histogram(reef, geometry, 100)
    .setSeriesNames(['Blue', 'Green', 'Red', 'NIR'])
    .setOptions(options);
// print histogram
print(reef_hist);