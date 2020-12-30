# Map of islands and shallow water areas in the Spermonde Archipelago (Indonesia) 
This repository contains data and code used to make a map of islands and shallow water areas for the Spermonde Archipelago, Indonesia. The map was obtained using a two-stepped classification approach, described below, and simple statistics and graphs were then calculated in python.

## Similar works in the same area
This is not the first work where satellite data is used to map the study area. For previous works, see:

> Nurdin, N., Komatsu, T., AS, M.A., Djalil, A.R. and Amri, K., 2015. Multisensor and multitemporal data from Landsat images to detect damage to coral reefs, small islands in the Spermonde archipelago, Indonesia. Ocean Science Journal, 50(2), pp.317-325.

> Fujii, M., 2017. Mapping the change of coral reefs using remote sensing and in situ measurements: a case study in Pangkajene and Kepulauan Regency, Spermonde Archipelago, Indonesia. Journal of oceanography, 73(5), pp.623-645.

> Thalib, M.S., Nurdin, N. and Aris, A., 2018, June. The ability of lyzenga’s algorithm for seagrass mapping using sentinel-2a imagery on Small Island, Spermonde Archipelago, Indonesia. In Proceeding of IOP Conference Series: Earth and Environmental Science (Vol. 165, No. 1, p. 012028).

## Two-stepped mapping approach
### Step 1: High-resolution imagery mapping
The starting point is a high-resolution multispectral (R,G,B,NIR) PLEIADES image acquired on 2020-03-26. The image was pan-sharpened using ArcMap and the panchromatic image accompanying the original dataset. 

IMAGE

This image was then classified with Trimble Ecognition Developer (ver.9.5.1) as follows:
1. The image was segmented using a "multiresolution segmentation", giving as weights for R,G,B = 1 and NIR = 2. The scale parameter of the segmentation was set to 200. The shape of the homogeneity criterion was set to 0.1 and its compactness was set to 0.5.
2. Six classes were defined: Built environment,Deep water,Shallow-water sand/reef complex,Beach sands,Shallow-water reef,Vegetation. These classes were used in a Nearest Neighbor classification. The results were exported as shapefile (smooting the edges with the built-in Ecognition export function).


