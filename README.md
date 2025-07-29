# AHJ-Boundaries-Copy
Data and Scripts associated with the CRS Project subtask AHJ Database. This includes the raw data on California zipcodes, city and county boundaries, climate zone identifiers, population, and personnel information. 

Repository was manually modeled using the CookieCutter Data Science format. Scripts and notebooks can be found under 'notebooks'. The data, processed and raw files, can be found under 'data'; this includes the Composite California GeoData spreadsheet, the Composite Position Search Results spreadsheet, the 2023 City & County extractions from Government Compensation California, and the corresponding City & County test/train spreadsheets for the Classification Model. 

1) Preliminary analysis is done in the 'AHJ Database_California Built Environment Personnel Mapping 2025' notebook. There are 4 versions to date. 
2) The 'ClassificationModel_TrainTest' notebook is strictly for creating test/train outputs from a base spreadsheet. These were made obsolete by V.4.
3) The 'Classification Model - V1' notebook is the first version of the model, the output is the 'city_filtered_test_data' spreadsheet.
4) There are final processed files that correspond to earlier versions of the Classification Model(s). V.4 includes the composite GCC spreadsheet but does not produce a specific file due to git's file size limits.
5) Converted to CCDS format on 7/29; files will need paths updated

Last Updated: 07/29/2025
Updated by: Robert Ford
