/**
 * Synthetic, internally consistent example properties. These names, rents and
 * amenities do not identify actual communities or represent live availability.
 * Never silently substitute these records for verified, licensed listing feeds.
 */
export const SAMPLE_LISTINGS = Object.freeze([
  { id:"demo-01", name:"Sample Garden Flat", city:"College Park", state:"GA", zip:"30337", beds:1, baths:1, sqft:640, rent:825, deposit:400, applicationFee:55, adminFee:100, estimatedUtilities:110, parkingFee:0, petRent:0, petFriendly:false, features:["Near transit","Laundry access"], tone:"sage" },
  { id:"demo-02", name:"Sample Parkside Home", city:"Union City", state:"GA", zip:"30291", beds:2, baths:1, sqft:875, rent:985, deposit:500, applicationFee:65, adminFee:125, estimatedUtilities:130, parkingFee:0, petRent:25, petFriendly:true, features:["Two bedrooms","Pet-friendly"], tone:"blue" },
  { id:"demo-03", name:"Sample Studio Loft", city:"Hapeville", state:"GA", zip:"30354", beds:0, baths:1, sqft:480, rent:895, deposit:350, applicationFee:60, adminFee:75, estimatedUtilities:90, parkingFee:50, petRent:0, petFriendly:false, features:["Studio","Parking option"], tone:"sand" },
  { id:"demo-04", name:"Sample Eastside Apartment", city:"East Point", state:"GA", zip:"30344", beds:1, baths:1, sqft:715, rent:1080, deposit:540, applicationFee:50, adminFee:150, estimatedUtilities:115, parkingFee:0, petRent:20, petFriendly:true, features:["Pet-friendly","One bedroom"], tone:"peach" },
  { id:"demo-05", name:"Sample Meadow View", city:"Decatur", state:"GA", zip:"30030", beds:2, baths:2, sqft:1010, rent:1475, deposit:700, applicationFee:75, adminFee:175, estimatedUtilities:150, parkingFee:35, petRent:25, petFriendly:true, features:["Two bathrooms","Parking option"], tone:"sage" },
  { id:"demo-06", name:"Sample Courtyard Residence", city:"College Park", state:"GA", zip:"30349", beds:2, baths:1, sqft:930, rent:1125, deposit:450, applicationFee:65, adminFee:95, estimatedUtilities:135, parkingFee:0, petRent:0, petFriendly:false, features:["Two bedrooms","Courtyard"], tone:"blue" },
  { id:"demo-07", name:"Sample West End Suite", city:"Atlanta", state:"GA", zip:"30310", beds:1, baths:1, sqft:690, rent:1195, deposit:595, applicationFee:65, adminFee:175, estimatedUtilities:120, parkingFee:75, petRent:30, petFriendly:true, features:["City location","Pet-friendly"], tone:"peach" },
  { id:"demo-08", name:"Sample Starter Studio", city:"Union City", state:"GA", zip:"30291", beds:0, baths:1, sqft:510, rent:780, deposit:300, applicationFee:45, adminFee:80, estimatedUtilities:95, parkingFee:0, petRent:0, petFriendly:false, features:["Budget option","Studio"], tone:"sand" }
]);