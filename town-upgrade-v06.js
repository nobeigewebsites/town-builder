
/* =====================================================
   TOWN BUILDER V0.6
   THE ULTIMATE CATALOGUE
   Requires V0.2, V0.3, V0.4 and V0.5
   ===================================================== */

(()=>{
'use strict';

// =====================================================
// 01 — PRESERVE EXISTING GAME SYSTEMS
// =====================================================

const previousDraw=drawObject;
const previousMode=selectMode;

const previousPreviews=new Map();

const tabs=$('categories');
const catalogue=$('catalogue');

for(const tab of [...tabs.children]){

    tab.click();

    for(const card of catalogue.children){

        const canvas=card.querySelector('canvas');

        if(canvas){

            previousPreviews.set(
                card.dataset.type,
                canvas
            );
        }
    }
}

const artwork={};
const spriteCache=new Map();

const previousCount=Object.keys(TYPES).length;

// =====================================================
// 02 — MASSIVE CONSTRUCTION CATALOGUE
//
// ID | Name | Cost | Income | Population |
// Shape | Wall colour | Roof colour | Detail
// =====================================================

const data=`

@Homes|Homes
edwardian|Edwardian villa|480|57|6|villa|#ecd3af|#875f56|brick
artdeco|Art Deco residence|620|76|8|modern|#f0dfc6|#668d94|balcony
italian|Italian townhouse|460|54|6|row|#edc58a|#be6849|balcony
tuscan|Tuscan farmhouse|420|49|5|villa|#e7c18a|#a86546|stone
french|French country house|450|52|6|manor|#eee0bc|#6e8496|porch
dutch|Dutch canal house|390|46|5|row|#b87b61|#5a687a|brick
greek|Greek island house|320|39|4|modern|#fff3db|#518fb9|terrace
japanese|Japanese residence|420|49|5|cottage|#e6d7b5|#596d65|timber
scandi|Scandinavian cabin|280|34|4|cottage|#dba07a|#586c78|timber
logcabin|Woodland log cabin|220|28|3|cottage|#b98a59|#79543d|timber
beachhut|Beach bungalow|160|21|2|cottage|#b3ded9|#689cb0|porch
thatched|Thatched cottage|280|35|4|cottage|#f3e1b5|#a68b48|garden
farmcottage|Farm workers cottage|180|24|3|cottage|#d5c6a5|#798582|stone
colonial|Colonial residence|490|58|7|villa|#f0e4c4|#8399a2|porch
spanish|Spanish hacienda|580|70|8|villa|#f5d7a0|#b86c48|terrace
mansion|Luxury mansion|1400|165|18|manor|#f8e7c4|#677887|columns
penthouse|Penthouse apartments|1150|142|20|tower|#e9e3d2|#66919d|balcony
terraced|Traditional terraced house|260|32|4|row|#d6a083|#766b64|brick
student|Student accommodation|580|72|14|tower|#d7cbb6|#77949d|balcony
retirement|Retirement apartments|620|74|12|villa|#e9dbba|#869d83|garden
countryside|Countryside bungalow|200|25|3|cottage|#f3dbb5|#af6e54|porch
canadian|Canadian timber house|350|44|5|villa|#d8ae84|#667a8b|timber
brownstone|Brownstone residence|560|67|8|row|#b88971|#646c78|brick
fairytale|Fairytale cottage|490|57|5|cottage|#f1d2c5|#937da0|garden

@Shops|Business
antiques|Antique shop|330|45|0|shop|#e2c3a3|#6f897b|ANTIQUES
toys|Toy shop|310|43|0|shop|#f5d6a3|#9c84b1|TOYS
petshop|Pet shop|280|37|0|shop|#d9e5b9|#6f9b8b|PETS
jeweller|Jewellery shop|450|64|0|shop|#e3d8c9|#77728d|JEWELS
records|Record shop|290|41|0|shop|#dbc6de|#7e718f|RECORDS
stationery|Stationery shop|230|31|0|shop|#e5cfb6|#6e9a9e|PAPER
furniture|Furniture showroom|500|68|0|market|#e2c6a7|#96765a|FURNITURE
shoeshop|Shoe shop|310|42|0|shop|#e0b6a4|#845c57|SHOES
gardencentre|Garden centre|380|49|0|glass|#bed6ad|#79ada1|GARDEN
giftshop|Gift shop|260|36|0|shop|#e9c5d4|#bd799d|GIFTS
charityshop|Charity shop|180|23|0|shop|#cbdcbd|#83a77e|CHARITY
tailor|Tailors shop|280|37|0|shop|#dcc6ae|#777f96|TAILOR
barber|Barber shop|220|31|0|shop|#dfd1bd|#668eab|BARBER
salon|Beauty salon|340|47|0|shop|#f0c9dd|#ad83b1|SALON
electronics|Electronics shop|550|76|0|market|#d6e0e2|#628ca5|TECH
musicshop|Musical instruments|330|46|0|shop|#e7c39f|#976b58|MUSIC
bookstall|Second hand bookshop|210|29|0|shop|#e4d0ae|#778b70|BOOKS
fabricshop|Fabric and craft shop|260|35|0|shop|#e3c2d8|#a584a9|CRAFT
newsagent|Newsagent|200|28|0|shop|#e7d4ac|#729898|NEWS
bikeShop|Bicycle shop|300|42|0|shop|#d4dfb9|#729d8b|BIKES
carDealer|Car dealership|720|98|0|market|#dce2e4|#6d8799|MOTORS
shoppingArcade|Shopping arcade|1250|155|0|manor|#ecddc2|#748a98|ARCADE
superstore|Department store|1050|139|0|tower|#e1c9b7|#728b98|STORE
marketHall|Covered market|640|88|0|market|#e9d2a8|#779782|MARKET

@Food and drink|Business
tearoom|Traditional tearoom|280|39|0|cottage|#f5d7c5|#b67c88|TEA ROOM
pizza|Pizzeria|340|47|0|shop|#e9cd98|#be6650|PIZZA
deli|Delicatessen|300|42|0|shop|#f1d4ac|#819465|DELI
fishchips|Fish and chip shop|280|40|0|shop|#d0e1e2|#5d98b0|FISH
chocolatier|Chocolatier|330|48|0|shop|#e6c0a5|#8b5e4c|CHOCOLATE
sweetshop|Traditional sweet shop|260|38|0|shop|#f4c9cf|#b689b5|SWEETS
sushi|Sushi restaurant|450|60|0|cottage|#ead9b4|#6f8572|SUSHI
noodles|Noodle bar|320|44|0|shop|#e5c798|#a85a4f|NOODLES
steakhouse|Steakhouse|550|76|0|villa|#d1ae86|#805247|STEAK
seafood|Seafood restaurant|500|68|0|villa|#cce0d7|#6299b1|SEAFOOD
patisserie|French patisserie|360|51|0|shop|#f3d7bd|#a87d9b|CAKES
coffee|Coffee house|320|44|0|shop|#e8c9a9|#8a715b|COFFEE
juice|Juice bar|230|33|0|shop|#f3e5a7|#91ae6f|JUICE
foodCourt|Food court|740|99|0|market|#efd9ae|#7f9f9e|FOOD HALL
foodTruck|Food truck|120|18|0|vehicle|#e9c99b|#d77860|FOOD
fishMarket|Fish market|400|57|0|market|#d2e1de|#639bb1|FISH MARKET

@Civic|Services
embassy|Embassy|780|0|0|manor|#eee2c6|#728b9b|EMBASSY
passport|Passport office|360|0|0|civic|#e4d6be|#728e98|PASSPORT
taxoffice|Tax office|420|0|0|civic|#ddd5c0|#738993|TAX
planning|Planning department|380|0|0|civic|#e4d3af|#7a9787|PLANNING
crematorium|Crematorium|460|0|0|civic|#ddd6bf|#778b87|MEMORIAL
cemetery|Cemetery|180|0|0|garden|#a9c28b|#c5c4b6|cemetery
memorial|Remembrance garden|120|0|0|garden|#9cbd79|#e8d9c4|memorial
shelter|Homeless shelter|260|0|0|villa|#e6d6b6|#849b8e|SHELTER
jobcentre|Employment centre|300|0|0|civic|#e1d1b8|#7895a1|JOBS
foodbank|Community food bank|220|0|0|market|#e7dfb8|#87a879|FOOD BANK
fireHQ|Fire service headquarters|900|0|0|civic|#d9b19c|#ae554b|FIRE HQ
policeHQ|Police headquarters|950|0|0|civic|#d4e0e5|#557b9c|POLICE HQ
coastguard|Coastguard station|420|0|0|tower|#e9e1c8|#689ab4|COASTGUARD
civildefence|Emergency management centre|690|0|0|civic|#dfd9c3|#83978e|EMERGENCY
nationalBank|Central bank|1150|0|0|manor|#e6d5ad|#6e838a|BANK

@Healthcare|Services
dentist|Dental surgery|320|0|0|cottage|#e4e9dd|#71a5ac|DENTIST
optician|Opticians|280|0|0|shop|#dbe3db|#7798b0|OPTICAL
vet|Veterinary surgery|380|0|0|villa|#e4d6ba|#84a889|VET
maternity|Maternity hospital|920|0|0|civic|#f0d9d6|#9c9ebc|MATERNITY
rehab|Rehabilitation centre|650|0|0|villa|#e6e6d5|#83a59d|REHAB
carehome|Residential care home|570|0|0|villa|#eddcc3|#91a88d|CARE
animalHospital|Animal hospital|580|0|0|civic|#e1e7d3|#7fa88e|ANIMAL CARE
medicalLab|Medical laboratory|620|0|0|modern|#dbe6e4|#7397a6|LAB
healthCentre|Community health centre|460|0|0|civic|#e7e5d5|#77a9a5|HEALTH

@Education|Services
musicSchool|Music academy|460|0|0|villa|#e9d2b9|#9785a6|MUSIC
artCollege|College of art|650|0|0|civic|#ead2bb|#a17e8d|ART
research|Scientific research centre|1100|0|0|modern|#dce8e5|#779aa9|SCIENCE
boarding|Boarding school|850|0|0|manor|#e3c6a0|#7b8898|ACADEMY
engineering|Engineering college|720|0|0|civic|#d4e0df|#7292a1|ENGINEERING
language|Language school|360|0|0|villa|#e9d6b6|#81a296|LANGUAGES
theology|Historic university college|950|0|0|manor|#d7c6a7|#77838b|COLLEGE
planetarium|Planetarium|780|50|0|dome|#d4e2e3|#668ba9|SPACE
publicArchive|Public records archive|500|0|0|civic|#e4d3b8|#8e8b9c|ARCHIVE
drivingSchool|Driving school|280|0|0|shop|#e8d9b2|#829ba3|DRIVING

@Tourism|Business
palace|Royal palace|2100|210|0|manor|#f6e3b9|#8196ab|columns
romanVilla|Roman villa ruins|650|65|0|ruins|#d9ccb1|#b1a58c|roman
amphitheatre|Roman amphitheatre|1300|130|0|arena|#d8c7ab|#ae9576|roman
archaeology|Archaeological site|440|40|0|ruins|#d8c39b|#ad9672|excavation
heritageMuseum|Heritage museum|780|90|0|manor|#e8d9b9|#758c98|MUSEUM
scienceMuseum|Science museum|920|110|0|dome|#dbe6de|#7797af|SCIENCE
transportMuseum|Transport museum|740|85|0|market|#e2c6a6|#778e97|TRANSPORT
waxMuseum|Wax museum|620|75|0|civic|#e6cbb5|#9f7d94|WAX MUSEUM
openAirMuseum|Open air museum|580|66|0|ruins|#d1c39d|#9b846b|heritage
lighthouse|Historic lighthouse|580|55|0|lighthouse|#f1e9d3|#b65d4f|light
touristRail|Heritage railway attraction|760|82|0|market|#d9bd96|#6f8c91|HERITAGE RAIL
campground|Camping site|200|28|0|tents|#a5c47b|#7ea28f|camping
caravan|Caravan park|320|45|0|vehicle|#eee2c6|#8eaea9|caravan
spa|Luxury spa resort|780|95|0|villa|#ede1cb|#84aca5|SPA
hostel|Youth hostel|260|35|0|villa|#e4c7a2|#779989|HOSTEL
holidayCottage|Holiday cottage|320|46|0|cottage|#f0d8ac|#a97c60|HOLIDAY
travelAgency|Travel agency|260|35|0|shop|#d3e4df|#779cba|TRAVEL

@Funfair|Business
circus|Grand circus big top|680|95|0|circus|#f6e1b2|#c85b56|circus
rollercoaster|Roller coaster|1400|165|0|coaster|#edc77f|#bb675d|coaster
miniCoaster|Childrens roller coaster|620|75|0|coaster|#a4c8bb|#779bc0|coaster
dodgems|Bumper cars|520|68|0|arena|#ecd3b8|#839fb9|dodgems
helter|Helter skelter|480|63|0|rideTower|#f2d5b2|#c66d64|slide
ghostTrain|Ghost train|560|75|0|cottage|#a6a0b0|#675d7d|GHOST TRAIN
funhouse|Funhouse|420|58|0|cottage|#e9c2dc|#b878ad|FUN HOUSE
arcade|Amusement arcade|420|56|0|market|#d5c3e4|#917bc1|ARCADE
swingRide|Swing carousel|520|70|0|rideTower|#eed2a0|#83aebb|swing
dropTower|Drop tower|820|105|0|rideTower|#d8e1e2|#d37c69|drop
teaCups|Spinning teacups|320|43|0|arena|#efd4c9|#bc80ad|cups
hallMirrors|Hall of mirrors|390|51|0|modern|#d4dfe5|#a89bc3|MIRRORS
fortuneTent|Fortune teller tent|130|18|0|circus|#e2c6df|#8a72b2|tent
fairStall|Fairground game stall|110|16|0|tents|#f0d3a7|#cf7776|fair
candyFloss|Candy floss stand|90|14|0|tents|#f2c8d9|#d68fb0|fair
trampoline|Trampoline park|280|36|0|arena|#d7e1c7|#7799bd|trampoline
waterSlide|Water slide|650|86|0|rideTower|#d7e9e2|#5fa8c4|water
miniTrain|Miniature railway attraction|360|48|0|arena|#e8d4af|#ab7464|train

@Wildlife|Business
zoo|Zoological gardens|1500|170|0|animal|#afca82|#8eaa71|zoo
safari|Safari park|1800|205|0|animal|#d8c38d|#9d8968|giraffe
lion|Lion enclosure|540|54|0|animal|#d7c18c|#ba925a|lion
elephant|Elephant enclosure|680|65|0|animal|#b9c7a5|#939fa5|elephant
giraffe|Giraffe enclosure|620|61|0|animal|#d7c391|#c39b5e|giraffe
panda|Panda sanctuary|650|66|0|animal|#a8c58d|#e9e4db|panda
monkey|Monkey habitat|480|48|0|animal|#a3c18b|#a88b6d|monkey
penguin|Penguin habitat|490|52|0|animal|#d9e6e7|#769eb6|penguin
reptile|Reptile house|390|42|0|glass|#bbd8b3|#78a796|REPTILES
butterfly|Butterfly house|360|41|0|glass|#d3e4c1|#a1bab0|BUTTERFLIES
aviary|Tropical aviary|440|47|0|glass|#b8d5ad|#78a192|BIRDS
birdSanctuary|Bird sanctuary|310|32|0|garden|#a5c58a|#e9d7b8|wildlife
rescueAnimals|Animal rescue sanctuary|320|0|0|animal|#a8c58e|#bd9a76|deer
pettingZoo|Childrens petting zoo|240|32|0|animal|#a8c57c|#eadac1|sheep
deerPark|Deer park|230|29|0|animal|#a9c37c|#b69a75|deer
wildlifeCentre|Wildlife visitor centre|350|36|0|cottage|#dfd2ab|#789573|WILDLIFE

@Sports|Business
football|Football stadium|1500|155|0|sport|#d5dad0|#78ad72|football
cricket|Cricket ground|650|68|0|sport|#a4c482|#77a66e|cricket
rugby|Rugby ground|780|82|0|sport|#b3c693|#749c65|football
golf|Golf course|920|95|0|sport|#a7ca82|#79aa6b|golf
miniGolf|Miniature golf|320|38|0|sport|#a8ca7e|#79a96c|golf
racecourse|Horse racecourse|1400|140|0|arena|#c6c4a1|#a69470|race
bowling|Bowling alley|440|56|0|market|#e2cddd|#8d85b1|BOWLING
iceRink|Ice skating rink|680|82|0|sport|#e1e9e8|#8ec5da|ice
skatePark|Skate park|250|24|0|arena|#c9ccbf|#8a9da0|skate
athletics|Athletics stadium|850|90|0|sport|#d8c7b0|#b67b68|athletics
basketball|Basketball court|180|18|0|sport|#e7cba1|#ba8f66|basketball
gym|Fitness centre|360|44|0|modern|#d8dedd|#759ba5|GYM
martialArts|Martial arts academy|320|36|0|cottage|#e4d5ae|#778a7d|DOJO
equestrian|Equestrian centre|520|55|0|animal|#b8c78b|#a78661|horse
climbing|Climbing centre|440|52|0|civic|#d9cabb|#899da1|CLIMB

@Leisure|Business
nightclub|Nightclub|580|80|0|modern|#c9bfd6|#8679b0|CLUB
concertHall|Concert hall|920|110|0|manor|#e5d5c1|#a1819b|CONCERT
opera|Opera house|1200|135|0|manor|#eee0c1|#888ba4|OPERA
danceHall|Dance hall|420|55|0|civic|#efd0c5|#ae849d|DANCE
escapeRoom|Escape room attraction|340|47|0|shop|#c6b7d2|#766f90|ESCAPE
billiards|Billiards hall|320|40|0|market|#d8d3b6|#749282|BILLIARDS
boardgames|Board game cafe|290|38|0|shop|#e4d4b9|#a29a72|GAMES
outdoorCinema|Open air cinema|310|39|0|arena|#b4c890|#758692|cinema
musicVenue|Live music venue|480|62|0|civic|#e1c5ad|#8e7291|LIVE MUSIC

@Agriculture|Farming
lavender|Lavender field|140|18|0|field|#a0bd79|#9875bb|lavender
olive|Olive grove|180|23|0|field|#a8bc83|#788d62|orchard
pumpkins|Pumpkin patch|95|14|0|field|#b8a478|#e3a056|pumpkin
sunflowers|Sunflower field|105|15|0|field|#a4bf79|#efc65c|sunflower
corn|Sweetcorn field|110|16|0|field|#a8c079|#d6c45a|corn
wheat|Wheat field|90|14|0|field|#bba06e|#e9cf83|wheat
strawberry|Strawberry field|105|16|0|field|#a5c17d|#d87571|berries
blueberry|Blueberry plantation|130|19|0|field|#a9bf83|#7b84b9|berries
herbs|Herb garden|70|11|0|field|#aac887|#77996b|herbs
potatoes|Potato field|85|12|0|field|#b5a079|#719956|herbs
carrots|Carrot field|85|12|0|field|#b6a27a|#e69d60|carrot
cabbages|Cabbage field|85|12|0|field|#adc182|#8aac70|cabbage
cherryOrchard|Cherry orchard|190|25|0|field|#a9c780|#ce7677|orchard
lemonOrchard|Lemon grove|180|24|0|field|#a9c880|#eed06c|orchard
beehives|Bee farm|150|22|0|field|#b3cc89|#d7ae61|bees
stables|Horse stables|360|33|0|market|#d3b38a|#8c6751|STABLES
pigFarm|Pig farm|190|24|0|animal|#b8b88b|#e2b0ad|pig
goatFarm|Goat farm|170|21|0|animal|#afc28b|#e4dbc6|goat
duckPond|Duck pond|130|15|0|water|#a3c783|#80c5d5|ducks
mushrooms|Mushroom farm|150|22|0|field|#b0b887|#ddd0b6|mushroom
farmShop|Farm shop|230|35|0|cottage|#e6cca3|#79946b|FARM SHOP
farmersMarket|Farmers market|310|42|0|tents|#e6d4a8|#86a981|market
floraculture|Commercial flower farm|160|23|0|field|#a9c783|#d594b4|flowers

@Industry|Industry
pottery|Pottery works|420|52|0|industrial|#dbbb99|#a17b68|POTTERY
paperMill|Paper mill|620|72|0|industrial|#ddd2b7|#788e94|PAPER
furnitureFactory|Furniture factory|680|79|0|industrial|#d4c09c|#887a69|FURNITURE
glassworks|Glassworks|720|86|0|industrial|#d2ded9|#72969f|GLASS
cannery|Food cannery|550|66|0|industrial|#ded0af|#8ca48c|CANNERY
cheeseFactory|Cheese factory|480|56|0|industrial|#ebd9aa|#839b8b|CHEESE
winery|Winery|560|70|0|villa|#e1c69b|#9a725e|WINERY
chocolateFactory|Chocolate factory|650|78|0|industrial|#d9bba2|#916f60|CHOCOLATE
soapworks|Soap factory|410|48|0|industrial|#dfd6c7|#96a9a1|SOAP
cementWorks|Cement works|850|93|0|industrial|#c7c6b7|#888f91|CEMENT
steelworks|Steelworks|1200|125|0|industrial|#bfc6c8|#73808b|STEEL
shipyard|Shipyard|980|105|0|industrial|#c8d3d0|#71939e|SHIPYARD
printing|Printing works|420|52|0|industrial|#d9c6b0|#8b91a2|PRINT
electronicsFactory|Electronics factory|1050|120|0|industrial|#d7e2e1|#7798ab|ELECTRONICS
distribution|Distribution centre|700|80|0|market|#d5dcd5|#8297a2|LOGISTICS
quarry|Stone quarry|510|62|0|ruins|#cec2a6|#a8a495|quarry
blacksmith|Blacksmith workshop|270|34|0|cottage|#d7b997|#77665c|FORGE

@Transport|Services
freight|Rail freight terminal|780|45|0|industrial|#cbd2cb|#758b98|FREIGHT
tramDepot|Tram depot|490|20|0|market|#dfd4b8|#8e9d9e|TRAMS
coachStation|Coach station|550|30|0|market|#d5e0db|#7399ae|COACHES
taxiOffice|Taxi office|210|15|0|shop|#e6d6a7|#bba360|TAXI
bikeHire|Bicycle hire station|130|10|0|market|#d7dfb9|#83ab85|BIKE HIRE
carHire|Car rental office|280|24|0|shop|#dde0ce|#789ba9|CAR HIRE
fuel|Petrol station|410|48|0|market|#ded9cb|#b27467|FUEL
charging|Electric charging station|180|14|0|power|#c5d8b8|#71a995|charging
multistorey|Multi storey car park|550|25|0|tower|#d1d4ce|#899a9e|PARKING
heliport|Helipad facility|520|0|0|arena|#c6d0cd|#768b97|helipad
airportHotel|Airport hotel|780|96|0|tower|#e5ded0|#839da8|HOTEL
vehicleGarage|Vehicle repair garage|320|40|0|industrial|#d5c9b3|#86959d|REPAIRS

@Waterfront|Business
marina|Marina|520|52|0|pier|#dfd3b6|#78b5ce|marina
ferry|Ferry terminal|720|55|0|market|#dce3de|#769db2|FERRY
pier|Seaside pleasure pier|620|70|0|pier|#d3b58e|#75b6ca|pier
fishingHarbour|Fishing harbour|420|46|0|pier|#d6b78e|#75b8cf|fishing
boatHire|Boat hire|260|30|0|pier|#e5d2aa|#84b9cc|boats
yachtClub|Yacht club|680|78|0|villa|#eee4cb|#77a3b6|YACHT CLUB
beachClub|Beach club|430|53|0|tents|#eddbac|#80b5c8|beach
lifeguard|Lifeguard station|120|0|0|lighthouse|#f2ddb8|#c9695a|small
beachCafe|Beachside cafe|300|39|0|cottage|#e7dbc3|#7cbbba|BEACH CAFE
boathouse|Boathouse|280|24|0|cottage|#d9bf99|#7396a9|BOATHOUSE

@Utilities|Utilities
reservoir|Water reservoir|700|0|0|water|#b9c9a6|#70b5cc|reservoir
hydro|Hydroelectric station|1400|0|0|power|#c5d2cb|#699daf|hydro
battery|Battery storage facility|480|0|0|power|#cfdbd1|#79a491|battery
gasPlant|Gas power station|1050|0|0|industrial|#c9c9bf|#82929d|GAS POWER
biomass|Biomass power station|780|0|0|industrial|#c2c9ac|#84976f|BIOMASS
compost|Composting facility|260|0|0|field|#aebc91|#927753|compost
desalination|Desalination plant|950|0|0|industrial|#d1dfdc|#78a3b6|WATER
waterTreatment|Water treatment plant|640|0|0|power|#cbd8cb|#6fa6b6|water
telecom|Telecommunications tower|420|0|0|power|#d4dfd3|#8c9ea6|tower
dataCentre|Data centre|920|0|0|modern|#d6dfdd|#7899a5|DATA
weatherStation|Weather station|260|0|0|power|#e1e4d3|#90a8aa|weather
wasteTransfer|Waste transfer station|380|0|0|industrial|#c9cdb5|#849778|WASTE

@Nature|Nature
japaneseGarden|Japanese garden|150|0|0|garden|#a7c58a|#d89caf|japanese
zenGarden|Zen garden|90|0|0|garden|#ded4b4|#a6aaa1|zen
woodland|Woodland grove|65|0|0|garden|#94b877|#648f62|woods
wetland|Wetland habitat|85|0|0|water|#abc68c|#7faeb6|wetland
waterfall|Ornamental waterfall|160|0|0|water|#b8c4a6|#7dc9da|waterfall
lilyPond|Water lily pond|75|0|0|water|#accb88|#8bc9d4|lilies
koiPond|Koi pond|100|0|0|water|#b6c68f|#79b7c9|koi
wildFlowers|Wildflower meadow|40|0|0|field|#a3c980|#e5abc5|flowers
formalGarden|Formal gardens|160|0|0|garden|#a6c789|#dba6bb|formal
maze|Hedge maze|140|0|0|garden|#91b96d|#518f59|maze
bamboo|Bamboo grove|35|0|0|garden|#b7ce88|#8caa63|bamboo
weepingWillow|Weeping willow|35|0|0|tree|#a4c77c|#7b9d65|willow
birch|Silver birch tree|28|0|0|tree|#b7d08c|#8ba86c|birch
redwood|Giant redwood|55|0|0|tree|#759e72|#6e8d5c|tall
magnolia|Magnolia tree|38|0|0|tree|#f1c1d4|#b88aab|flower
wisteria|Wisteria tree|45|0|0|tree|#c0b1df|#9b80b7|flower

@Fences|Nature
brickWall|Traditional brick wall|12|0|0|fence|#c18c73|#966957|solid
ornateFence|Ornamental iron railings|20|0|0|fence|#5f7474|#354c51|iron
ranchFence|Ranch fence|8|0|0|fence|#b99365|#92714f|wood
bambooFence|Bamboo fence|10|0|0|fence|#c2ae72|#9b915c|wood
gardenWall|Decorative garden wall|15|0|0|fence|#ddd2b9|#9eaa85|solid
tallHedge|Tall privacy hedge|14|0|0|fence|#79ab62|#4c8350|hedge
farmGate|Farm entrance gate|18|0|0|fence|#b7966c|#896748|gate

@Decoration|Nature
wishingWell|Wishing well|45|0|0|decor|#c9b99b|#8f7460|well
pergola|Garden pergola|65|0|0|decor|#c9aa7e|#8caa6d|pergola
bandstand|Victorian bandstand|115|0|0|decor|#f0e2c5|#789e9c|bandstand
picnic|Picnic area|35|0|0|decor|#c7a175|#a2c37f|picnic
phoneBox|Telephone box|25|0|0|decor|#c95f58|#a34340|phone
postBox|Post box|15|0|0|decor|#cb6459|#a4473d|post
flowerArch|Flower archway|45|0|0|decor|#e0b8c8|#79a56c|arch
obelisk|Ornamental obelisk|55|0|0|decor|#d9cbb0|#b4a794|obelisk
birdBath|Bird bath|25|0|0|decor|#d5cab2|#8abdc8|birdbath
gardenSculpture|Garden sculpture|65|0|0|decor|#e3dbc4|#abaeaa|sculpture
flagpole|Flagpole|20|0|0|decor|#e4d6b2|#749eaf|flag
flowerPlanters|Decorative flower planters|25|0|0|field|#a9c487|#d78bac|flowers
topiary|Ornamental topiary|35|0|0|garden|#a5c784|#568e55|topiary
noticeboard|Community noticeboard|15|0|0|decor|#c6a77f|#f1dfb6|board
fountainLarge|Grand ornamental fountain|170|0|0|water|#ddd0b6|#80c5d5|fountain
trellis|Flower trellis|25|0|0|decor|#b9996d|#d694b5|arch
streetClock|Ornamental street clock|35|0|0|decor|#d9c8a7|#6b7d7a|clock
entrance|Decorative town entrance|80|0|0|decor|#d2c4a8|#9a816d|arch
stoneBridge|Decorative model bridge|95|0|0|decor|#c9bea7|#9f8e76|bridge

@Festivals|Business
christmas|Christmas market|420|62|0|tents|#e4dbc2|#b85f57|christmas
halloween|Halloween fair|320|49|0|tents|#c5b49d|#a181b3|halloween
harvest|Harvest festival|300|45|0|tents|#dcc99e|#d0a65e|harvest
medieval|Medieval festival|420|59|0|tents|#d9c5a0|#a36f59|medieval
flowerShow|Flower show|280|41|0|field|#a7c984|#d8a4c9|flowers
wineFestival|Food and wine festival|380|56|0|tents|#e4d1ab|#a47b99|wine
musicFestival|Music festival grounds|680|95|0|arena|#c5c9a8|#8f87b2|music
winterVillage|Winter wonderland|550|78|0|tents|#e3e9e4|#86b3ce|winter
summerFair|Summer carnival|380|57|0|circus|#eeddb0|#d98b76|fair
lanternFestival|Lantern festival|280|44|0|tents|#e6d2ac|#d49765|lantern
easterFair|Easter festival|280|43|0|tents|#e5d8cf|#c29ac5|easter

@Faith|Services
monastery|Historic monastery|980|0|0|manor|#d7c8a8|#8c8379|MONASTERY
abbey|Abbey|1200|0|0|manor|#e0d2b2|#788998|ABBEY
mosque|Mosque|850|0|0|dome|#eadcc0|#7da59b|MOSQUE
synagogue|Synagogue|760|0|0|civic|#e4d6b9|#8099ad|SYNAGOGUE
buddhistTemple|Buddhist temple|780|0|0|manor|#ead5aa|#b96f4e|TEMPLE
shrine|Garden shrine|150|0|0|cottage|#e6d3ae|#b6745c|SHRINE

`;

let currentSection='';
let currentGroup='';

for(const raw of data.trim().split('\n')){

    const row=raw.trim();

    if(!row)continue;

    if(row.startsWith('@')){

        [
            currentSection,
            currentGroup
        ]=row.slice(1).split('|');

        continue;
    }

    const [
        shortId,
        name,
        cost,
        rent,
        pop,
        shape,
        wall,
        roof,
        detail
    ]=row.split('|');

    const id='v6_'+shortId;

    TYPES[id]={
        name,
        cost:Number(cost),
        rent:Number(rent),
        pop:Number(pop),
        group:currentGroup,
        section:currentSection
    };

    artwork[id]={
        shape,
        wall,
        roof,
        detail
    };
}

// =====================================================
// 03 — GRAPHICAL ASSET GENERATOR
// =====================================================

function getSprite(id,mask=0){

    const cacheKey=id+':'+mask;

    if(spriteCache.has(cacheKey)){

        const old=spriteCache.get(cacheKey);

        spriteCache.delete(cacheKey);
        spriteCache.set(cacheKey,old);

        return old;
    }

    const s=artwork[id];

    const c=document.createElement('canvas');

    c.width=256;
    c.height=304;

    const g=c.getContext('2d');

    g.scale(2,2);
    g.translate(64,122);

    const W=s.wall;
    const R=s.roof;

    const P=(x,y,z=0)=>[
        (x-y)*HW,
        (x+y)*HH-z
    ];

    const tone=(col,n)=>
        '#'+col.slice(1)
        .match(/../g)
        .map(v=>
            Math.max(
                0,
                Math.min(
                    255,
                    parseInt(v,16)+n
                )
            ).toString(16).padStart(2,'0')
        ).join('');

    function gradient(x,y,X,Y,a,b){

        const z=g.createLinearGradient(
            x,y,X,Y
        );

        z.addColorStop(0,a);
        z.addColorStop(1,b);

        return z;
    }

    function poly(points,fill,stroke){

        g.beginPath();

        points.forEach((p,i)=>
            i?g.lineTo(...p):g.moveTo(...p)
        );

        g.closePath();

        g.fillStyle=fill;
        g.fill();

        if(stroke){

            g.strokeStyle=stroke;
            g.lineWidth=.65;
            g.stroke();
        }
    }

    const face=(p,col,stroke)=>
        poly(
            p.map(v=>P(...v)),
            col,
            stroke
        );

    function oval(x,y,rx,ry,col){

        g.beginPath();

        g.ellipse(
            x,y,rx,ry,
            0,0,Math.PI*2
        );

        g.fillStyle=col;
        g.fill();
    }

    function line(a,b,col,w=1){

        g.beginPath();

        g.moveTo(...a);
        g.lineTo(...b);

        g.lineCap='round';
        g.lineWidth=w;
        g.strokeStyle=col;
        g.stroke();
    }

    const L=(a,b,col,w)=>
        line(P(...a),P(...b),col,w);

    function flat(a,b,c,d,col,z=0){

        face([
            [a,b,z],
            [c,b,z],
            [c,d,z],
            [a,d,z]
        ],col);
    }

    function base(col='#a8c780'){

        oval(5,5,36,12,'#38513825');

        flat(
            -.47,-.47,.47,.47,
            col
        );
    }

    function block(a,b,c,d,z,h,col){

        face([
            [a,d,z],
            [c,d,z],
            [c,d,z+h],
            [a,d,z+h]
        ],gradient(
            -25,-h,20,10,
            tone(col,14),
            tone(col,-9)
        ),'#685c4930');

        face([
            [c,b,z],
            [c,d,z],
            [c,d,z+h],
            [c,b,z+h]
        ],tone(col,-31),'#685c4930');

        flat(
            a,b,c,d,
            tone(col,20),z+h
        );
    }

    function cylinder(x,y,z,h,r,col){

        const [a,b]=P(x,y,z);

        g.fillStyle=gradient(
            a-r,b,a+r,b,
            tone(col,22),
            tone(col,-32)
        );

        g.fillRect(a-r,b-h,r*2,h);

        oval(a,b,r,r*.34,tone(col,-9));

        oval(a,b-h,r,r*.34,tone(col,22));
    }

    function bush(x,y,col='#80b45d',scale=1){

        const [a,b]=P(x,y);

        oval(
            a+2,b+1,
            6*scale,2.5*scale,
            '#37553927'
        );

        for(let i=0;i<3;i++){

            oval(
                a+(i-1)*3*scale,
                b-(3+i%2)*scale,
                4.2*scale,
                4.1*scale,
                gradient(
                    a-7,b-9,
                    a+6,b,
                    tone(col,28),
                    tone(col,-33)
                )
            );
        }
    }

    function tree(x,y,col='#85b65e',scale=1){

        const p=P(x,y);

        g.save();

        g.translate(...p);
        g.scale(scale,scale);

        oval(6,3,16,6,'#36563a28');

        line(
            [0,1],[0,-29],
            '#966c46',4
        );

        const crowns=[
            [-9,-25,11],
            [8,-26,12],
            [-7,-36,12],
            [7,-37,11],
            [0,-46,10],
            [0,-29,12]
        ];

        for(const [a,b,r] of crowns){

            oval(
                a,b,r,r*.9,
                gradient(
                    a-r,b-r,
                    a+r,b+r,
                    tone(col,25),
                    tone(col,-36)
                )
            );

            oval(
                a-r*.27,
                b-r*.3,
                r*.35,r*.2,
                '#fff1c037'
            );
        }

        g.restore();
    }

    function flower(x,y,col){

        const p=P(x,y);

        line(
            p,
            [p[0],p[1]-5],
            '#629352',1.1
        );

        oval(
            p[0],p[1]-5,
            2.5,2,col
        );

        oval(
            p[0],p[1]-5,
            .8,.7,'#f9edb3'
        );
    }

    function windowAt(
        x,y,z,w=.13,h=10,
        side=false
    ){

        const Q=(u,v)=>side
            ?P(x,y+u,z+v)
            :P(x+u,y,z+v);

        poly([
            Q(-.015,-1),
            Q(w+.015,-1),
            Q(w+.015,h+1),
            Q(-.015,h+1)
        ],'#f9eacb','#a28d72');

        poly([
            Q(.015,1),
            Q(w-.015,1),
            Q(w-.015,h-1),
            Q(.015,h-1)
        ],gradient(
            ...Q(0,h),
            ...Q(w,0),
            '#b4dee3',
            '#387496'
        ));

        line(
            Q(w/2,1),
            Q(w/2,h-1),
            '#fff1d5',.85
        );

        line(
            Q(.02,h/2),
            Q(w-.02,h/2),
            '#fff1d5',.65
        );

        line(
            Q(-.025,0),
            Q(w+.025,0),
            '#bba17c',1.6
        );
    }

    function door(
        x,y,z=0,w=.16,h=14
    ){

        face([
            [x-w/2,y,z],
            [x+w/2,y,z],
            [x+w/2,y,z+h],
            [x-w/2,y,z+h]
        ],'#805d45','#f0dfb9');

        oval(
            ...P(x+w*.24,y,z+h*.45),
            .8,.8,'#ebcb81'
        );
    }

    function sign(text,x,y,z){

        const p=P(x,y,z);

        g.save();

        g.translate(...p);
        g.transform(1,.5,0,1,0,0);

        g.fillStyle='#fff1d0';

        g.fillRect(-16,-3.5,32,7);

        g.strokeStyle='#93785d';
        g.lineWidth=.5;

        g.strokeRect(-16,-3.5,32,7);

        g.font='bold 4.6px sans-serif';
        g.textAlign='center';
        g.fillStyle='#655142';

        g.fillText(
            text.toUpperCase(),
            0,1.5,29
        );

        g.restore();
    }

    // =================================================
    // TILED THREE DIMENSIONAL ROOFS
    // =================================================

    function roof(
        a,b,c,d,h,r,
        col=R,hip=false
    ){

        const m=(a+c)/2;
        const y0=hip?b+.12:b;
        const y1=hip?d-.12:d;

        face([
            [a,d,h],
            [c,d,h],
            [m,y1,h+r]
        ],hip?tone(col,10):W);

        const sides=[
            [
                a,m,h,h+r,
                b,d,y0,y1,
                tone(col,13)
            ],
            [
                m,c,h+r,h,
                y0,y1,b,d,
                tone(col,-17)
            ]
        ];

        for(const [
            x0,x1,z0,z1,
            ya,yb,YA,YB,
            color
        ] of sides){

            face([
                [x0,ya,z0],
                [x0,yb,z0],
                [x1,YB,z1],
                [x1,YA,z1]
            ],color,'#6a514b50');

            for(let i=1;i<7;i++){

                const t=i/7;

                const x=x0+(x1-x0)*t;
                const z=z0+(z1-z0)*t;

                const u=ya+(YA-ya)*t;
                const v=yb+(YB-yb)*t;

                L(
                    [x,u,z],
                    [x,v,z],
                    tone(color,-27),.8
                );

                const prev=(i-1)/7;

                const xx=x0+(x1-x0)*prev;
                const zz=z0+(z1-z0)*prev;

                const uu=ya+(YA-ya)*prev;
                const vv=yb+(YB-yb)*prev;

                for(let j=1;j<6;j++){

                    const f=
                        (j-(i%2)*.4)/6;

                    L(
                        [
                            x,
                            u+(v-u)*f,z
                        ],
                        [
                            xx,
                            uu+(vv-uu)*f,zz
                        ],
                        tone(color,-19),.45
                    );
                }
            }
        }

        L(
            [m,y0,h+r],
            [m,y1,h+r],
            tone(col,37),1.8
        );
    }

    const sh=s.shape;
    const d=s.detail;

    // =================================================
    // 04 — SPECIALIST LANDMARKS
    // =================================================

    if(sh==='circus'){

        base('#d9c8a3');

        oval(
            0,3,36,15,
            '#af9474'
        );

        oval(
            0,-1,33,13,
            '#eed8ae'
        );

        for(let i=0;i<10;i++){

            const a=i*Math.PI/10;

            const b=(i+1)*Math.PI/10;

            poly([
                [
                    33*Math.cos(a),
                    10*Math.sin(a)-3
                ],
                [
                    33*Math.cos(b),
                    10*Math.sin(b)-3
                ],
                [0,-57]
            ],i%2?W:R);
        }

        poly([
            [-33,-3],
            [0,-57],
            [33,-3],
            [0,-17]
        ],gradient(
            -33,-25,33,-8,
            tone(R,22),
            tone(R,-18)
        ));

        for(let i=-2;i<=2;i++){

            poly([
                [i*12,-4],
                [i*12+6,-4],
                [0,-57]
            ],W);
        }

        oval(0,-3,8,4,'#644e47');

        line(
            [0,-57],[0,-67],
            '#8c7659',1.4
        );

        poly([
            [0,-67],
            [13,-63],
            [0,-59]
        ],'#efd486');

        flower(-.4,.4,'#f2ce76');

        flower(.4,.35,'#e79dbb');

    }else if(sh==='coaster'){

        base('#aec48b');

        const points=[
            [-.43,.3,8],
            [-.24,.3,28],
            [-.06,.3,57],
            [.12,.3,38],
            [.35,.3,12],
            [.35,-.28,23],
            [.04,-.28,43],
            [-.24,-.28,19],
            [-.43,.3,8]
        ];

        for(const p of points){

            L(
                [p[0],p[1],0],
                p,
                '#987b60',2.5
            );
        }

        for(let i=1;i<points.length;i++){

            const a=points[i-1];
            const b=points[i];

            L(a,b,'#705a4f',5);

            L(a,b,R,3.2);

            L(
                [a[0],a[1],a[2]+2],
                [b[0],b[1],b[2]+2],
                tone(W,20),1
            );
        }

        block(
            -.13,.23,.03,.35,
            46,5,'#e3b44f'
        );

        block(
            -.23,.23,-.13,.35,
            34,5,'#d67765'
        );

    }else if(sh==='rideTower'){

        base('#d6d2b4');

        cylinder(
            0,0,0,
            d==='drop'?87:61,
            9,W
        );

        if(d==='slide'||d==='water'){

            for(let i=0;i<48;i++){

                const a=i*.28;
                const b=(i+1)*.28;

                const y=-61+i*1.25;

                line(
                    [
                        21*Math.cos(a),
                        y+7*Math.sin(a)
                    ],
                    [
                        21*Math.cos(b),
                        y+1.25+7*Math.sin(b)
                    ],
                    R,6
                );
            }

        }else if(d==='swing'){

            oval(
                0,-61,28,11,R
            );

            for(let i=0;i<6;i++){

                const a=i*Math.PI/3;

                const x=23*Math.cos(a);
                const y=8*Math.sin(a);

                line(
                    [x,-61+y],
                    [x*1.25,-31+y],
                    '#9c876d',1.3
                );

                oval(
                    x*1.25,
                    -31+y,4,3,
                    '#efc16c'
                );
            }

        }else{

            block(
                -.19,-.19,.19,.19,
                43,8,R
            );
        }

        poly([
            [-16,-61],
            [0,-77],
            [16,-61]
        ],tone(R,10));

    }else if(sh==='arena'||sh==='sport'){

        base('#d2c9ad');

        oval(
            0,0,37,18,
            tone(W,-19)
        );

        oval(0,-2,33,15,W);

        oval(
            0,-3,28,12,
            sh==='sport'?R:'#b9c6ad'
        );

        if(d==='football'||
           d==='basketball'||
           d==='cricket'){

            flat(
                -.30,-.32,.30,.32,
                R,1
            );

            for(const x of [-.3,0,.3]){

                L(
                    [x,-.31,2],
                    [x,.31,2],
                    '#fff0d6',1
                );
            }

            for(const y of [-.31,.31]){

                L(
                    [-.3,y,2],
                    [.3,y,2],
                    '#fff0d6',1
                );
            }

            oval(0,-1,6,3,'#e2ebce');

        }else if(d==='golf'){

            oval(-14,-4,12,6,'#bed78c');

            oval(15,4,8,4,'#d6c99e');

            line(
                [-11,-4],[-11,-18],
                '#fff1cc',1.4
            );

            poly([
                [-11,-18],
                [0,-15],
                [-11,-12]
            ],'#d16e5a');

        }else if(d==='helipad'){

            g.font='bold 23px sans-serif';
            g.textAlign='center';
            g.fillStyle='#fff2ce';
            g.fillText('H',0,6);

        }else if(d==='cinema'||
                 d==='music'){

            block(
                -.38,-.33,.38,-.27,
                0,28,'#7a8790'
            );

            face([
                [-.33,-.265,5],
                [.33,-.265,5],
                [.33,-.265,25],
                [-.33,-.265,25]
            ],'#efe5d2');

            for(let i=0;i<4;i++){

                for(let j=0;j<3;j++){

                    const p=P(
                        -.25+i*.17,
                        -.05+j*.16
                    );

                    oval(...p,3,2,R);
                }
            }

        }else if(d==='dodgems'||
                 d==='cups'||
                 d==='train'){

            for(let i=0;i<5;i++){

                const a=i*Math.PI*2/5;

                const x=22*Math.cos(a);
                const y=8*Math.sin(a);

                oval(
                    x,y,6,4,
                    [
                        '#d78376',
                        '#e5c46e',
                        '#8bb8c6',
                        '#b19aca',
                        '#9ab982'
                    ][i]
                );

                oval(
                    x,y-2,4,2,
                    '#f2e4ca'
                );
            }

        }else if(d==='ice'){

            oval(0,-3,26,11,'#b5dfe7');

            line(
                [-18,-4],[15,2],
                '#f1f8ee',1.5
            );

        }else if(d==='skate'){

            for(const x of [-.24,.20]){

                face([
                    [x,-.25,0],
                    [x+.12,-.25,10],
                    [x+.12,.25,10],
                    [x,.25,0]
                ],'#8f9fa0');
            }

        }else if(d==='roman'){

            for(let i=0;i<10;i++){

                const a=i*Math.PI/5;

                oval(
                    29*Math.cos(a),
                    12*Math.sin(a)-9,
                    5,9,'#bca98b'
                );
            }

        }else if(d==='race'||
                 d==='athletics'){

            oval(0,-2,29,13,R);

            oval(0,-2,20,8,'#a0bd7d');

            for(const x of [-12,0,12]){

                oval(x,-8,3,1.5,'#ecd9ad');
            }
        }

    // =================================================
    // 05 — ANIMALS AND ZOO HABITATS
    // =================================================

    }else if(sh==='animal'){

        base(W);

        tree(-.3,-.3,'#83a86b',.47);

        oval(
            10,4,12,5,
            '#83b8be'
        );

        for(const [x,y] of [
            [-.43,-.43],
            [.43,-.43],
            [-.43,.43],
            [.43,.43]
        ]){

            block(
                x-.025,y-.025,
                x+.025,y+.025,
                0,13,'#a18b6a'
            );
        }

        for(const z of [4,10]){

            L(
                [-.43,.43,z],
                [.43,.43,z],
                '#b39a75',1.4
            );

            L(
                [.43,-.43,z],
                [.43,.43,z],
                '#b39a75',1.4
            );
        }

        const kind=d==='zoo'?'giraffe':d;

        const positions=[
            [-.16,.1],
            [.17,-.12]
        ];

        for(const [x,y] of positions){

            const p=P(x,y);

            g.save();
            g.translate(...p);

            oval(
                2,1,8,3,
                '#46503c25'
            );

            let color=R;

            if(kind==='giraffe')color='#d9b56f';

            if(kind==='elephant')color='#a6b2b5';

            if(kind==='panda')color='#f1eadc';

            if(kind==='penguin')color='#4d5b67';

            if(kind==='sheep')color='#f0e8d6';

            if(kind==='lion')color='#d8ab69';

            if(kind==='horse')color='#ad825e';

            if(kind==='pig')color='#e9b4b3';

            oval(0,-5,7,4.5,color);

            for(const X of [-4,4]){

                line(
                    [X,-3],[X,3],
                    tone(color,-32),1.5
                );
            }

            if(kind==='giraffe'){

                line(
                    [4,-6],[6,-19],
                    color,4
                );

                oval(8,-20,4,2.7,color);

                for(const [a,b] of [
                    [-4,-6],[0,-3],
                    [3,-7],[6,-15]
                ]){

                    oval(
                        a,b,1.6,1.3,
                        '#a78150'
                    );
                }

            }else if(kind==='elephant'){

                oval(6,-7,4,4.5,color);

                oval(
                    3,-8,4,4,
                    '#a1a9aa'
                );

                line(
                    [8,-7],[10,1],
                    color,2.5
                );

            }else if(kind==='panda'){

                oval(5,-8,4,4,color);

                oval(3,-11,1.7,1.7,'#50565b');
                oval(7,-11,1.7,1.7,'#50565b');

                oval(4,-8,1,1.4,'#50565b');
                oval(7,-8,1,1.4,'#50565b');

            }else if(kind==='penguin'){

                oval(0,-9,4,7,color);

                oval(
                    0,-7,2.8,4.5,
                    '#f0efde'
                );

                oval(0,-16,3.2,3,color);

                oval(3,-15,2,1,'#d2a15a');

            }else if(kind==='lion'){

                oval(
                    6,-7,5,5,
                    '#b7854d'
                );

                oval(7,-7,3,3,color);

            }else{

                oval(6,-7,3.5,3,color);

                if(kind==='deer'||kind==='goat'){

                    line(
                        [6,-9],[5,-14],
                        '#a0815b',1
                    );

                    line(
                        [8,-9],[10,-14],
                        '#a0815b',1
                    );
                }
            }

            g.restore();
        }

    // =================================================
    // 06 — AGRICULTURAL FIELDS
    // =================================================

    }else if(sh==='field'){

        base(W);

        flat(
            -.42,-.42,.42,.42,
            d==='flowers'
                ?'#91b670'
                :'#aa8e63'
        );

        for(let i=0;i<4;i++){

            const x=-.32+i*.21;

            if(d!=='flowers'){

                flat(
                    x-.06,-.39,
                    x+.06,.39,
                    '#8d754f'
                );
            }

            for(let j=0;j<5;j++){

                const y=-.33+j*.16;

                const p=P(x,y);

                if(d==='orchard'){

                    if(i%2===0&&j%2===0){

                        tree(
                            x,y,'#8eb46a',.38
                        );

                        oval(
                            p[0]+2,p[1]-10,
                            1.8,1.6,R
                        );
                    }

                }else if(d==='bees'){

                    if(i%2===0&&j%2===0){

                        block(
                            x-.07,y-.07,
                            x+.07,y+.07,
                            0,9,R
                        );

                        for(let z=3;z<10;z+=3){

                            L(
                                [x-.07,y+.07,z],
                                [x+.07,y+.07,z],
                                '#a4834e',.8
                            );
                        }
                    }

                }else if(
                    d==='pumpkin'||
                    d==='cabbage'
                ){

                    oval(
                        p[0],p[1]-1,
                        4.2,3,R
                    );

                    line(
                        [p[0],p[1]-2],
                        [p[0],p[1]-6],
                        '#6e9755',1
                    );

                }else if(
                    d==='sunflower'||
                    d==='corn'||
                    d==='wheat'||
                    d==='lavender'
                ){

                    const h=
                        d==='sunflower'?12:8;

                    line(
                        p,
                        [p[0],p[1]-h],
                        '#6d914d',1.5
                    );

                    oval(
                        p[0],p[1]-h,
                        d==='lavender'?1.6:2.8,
                        d==='lavender'?4:2.5,
                        R
                    );

                }else if(d==='mushroom'){

                    line(
                        p,
                        [p[0],p[1]-4],
                        '#eee2cb',2
                    );

                    oval(
                        p[0],p[1]-5,
                        3.2,2,R
                    );

                }else if(d==='compost'){

                    oval(
                        p[0],p[1]-2,
                        4,3,R
                    );

                }else{

                    flower(x,y,R);
                }
            }
        }

    // =================================================
    // 07 — GARDENS, WATER AND LANDSCAPING
    // =================================================

    }else if(sh==='tree'){

        tree(
            0,0,W,
            d==='tall'?1.48:1.05
        );

    }else if(sh==='garden'){

        base(W);

        if(d==='cemetery'){

            for(let i=0;i<3;i++){

                for(let j=0;j<3;j++){

                    block(
                        -.3+i*.24,
                        -.3+j*.24,
                        -.23+i*.24,
                        -.25+j*.24,
                        0,8,R
                    );
                }
            }

        }else if(d==='maze'){

            for(let i=0;i<4;i++){

                for(let j=0;j<4;j++){

                    if((i+j)%3!==1){

                        bush(
                            -.32+i*.21,
                            -.32+j*.21,
                            R,1.1
                        );
                    }
                }
            }

        }else if(d==='zen'){

            flat(
                -.38,-.38,.38,.38,
                '#e1d7b7'
            );

            for(let i=0;i<8;i++){

                L(
                    [-.35,-.35+i*.1,1],
                    [.35,-.35+i*.1,1],
                    '#bfb59a',.6
                );
            }

            oval(-8,-4,10,6,'#a1a49b');

            oval(13,6,6,4,'#b9b5a4');

        }else if(
            d==='woods'||
            d==='wildlife'||
            d==='bamboo'
        ){

            for(const [x,y] of [
                [-.25,-.25],
                [.25,-.25],
                [-.25,.25],
                [.25,.25]
            ]){

                tree(
                    x,y,'#83ad69',.64
                );
            }

        }else{

            flat(
                -.07,-.44,.07,.44,
                '#e5d7b5'
            );

            flat(
                -.44,-.07,.44,.07,
                '#e5d7b5'
            );

            for(const [x,y] of [
                [-.27,-.27],
                [.27,-.27],
                [-.27,.27],
                [.27,.27]
            ]){

                if(d==='japanese'){

                    tree(
                        x,y,'#e2a8bf',.52
                    );

                }else{

                    bush(x,y,'#75a35e',1.3);

                    flower(x+.09,y,R);
                }
            }

            if(d==='memorial'){

                block(
                    -.08,-.08,.08,.08,
                    0,24,R
                );
            }
        }

    }else if(sh==='water'){

        base(W);

        oval(
            0,1,34,15,
            '#c8c6a9'
        );

        oval(
            0,-1,30,12,
            gradient(
                -30,-12,30,10,
                tone(R,28),
                tone(R,-20)
            )
        );

        for(let i=0;i<4;i++){

            line(
                [-20+i*12,-4],
                [-12+i*12,-2],
                '#dbf3e8',.9
            );
        }

        if(d==='waterfall'){

            block(
                -.35,-.35,.28,-.15,
                0,31,'#a0a99b'
            );

            poly([
                [-17,-34],
                [-2,-25],
                [7,2],
                [-9,2]
            ],gradient(
                -17,-34,7,2,
                '#e3f4ec',
                '#63b4cb'
            ));

        }else if(d==='fountain'){

            cylinder(
                0,0,0,13,5,
                '#e5d9bc'
            );

            oval(0,-14,12,4,'#d8cbb0');

            oval(0,-15,9,3,R);

            for(const x of [-5,0,5]){

                line(
                    [0,-25],
                    [x,-15],
                    '#d6f4ef',1.3
                );
            }

        }else if(d==='lilies'){

            for(let i=0;i<5;i++){

                const x=-20+i*10;

                oval(
                    x,i%2*5,4,2,
                    '#78a96c'
                );

                oval(
                    x,i%2*5-1,2,1.5,
                    '#efb2c9'
                );
            }

        }else if(d==='ducks'||d==='koi'){

            for(let i=0;i<3;i++){

                oval(
                    -13+i*13,
                    i%2*5,
                    3.5,1.8,
                    d==='koi'
                        ?'#e8a16b'
                        :'#f1e0af'
                );
            }
        }

        bush(-.33,-.3,'#83ae70',.7);

        bush(.33,.33,'#83ae70',.7);

    // =================================================
    // 08 — FESTIVAL STALLS
    // =================================================

    }else if(sh==='tents'){

        base('#c9c8a4');

        const colours=[
            R,
            '#deb76d',
            '#8ab2b2',
            '#b698bd'
        ];

        const places=[
            [-.22,-.22],
            [.22,-.22],
            [-.22,.22],
            [.22,.22]
        ];

        places.forEach(([x,y],i)=>{

            const col=colours[i];

            block(
                x-.13,y-.12,
                x+.13,y+.12,
                0,7,'#bd9a70'
            );

            face([
                [x-.17,y+.16,12],
                [x+.17,y+.16,12],
                [x,y,28]
            ],col);

            face([
                [x+.17,y-.16,12],
                [x+.17,y+.16,12],
                [x,y,28]
            ],tone(col,-25));

            for(const a of [-.13,.13]){

                L(
                    [x+a,y+.12,0],
                    [x+a,y+.12,12],
                    '#987b59',1
                );
            }
        });

        if(d==='christmas'||
           d==='winter'){

            tree(0,0,'#719a70',.5);

            for(let i=0;i<6;i++){

                oval(
                    (i%3-1)*4,
                    -6-i*2,
                    1.3,1.3,
                    '#f4d076'
                );
            }

        }else if(d==='halloween'){

            for(const x of [-16,10]){

                oval(
                    x,8,5,4,
                    '#e2a056'
                );

                line(
                    [x,4],[x,1],
                    '#749359',1.4
                );
            }
        }

    // =================================================
    // 09 — FENCES AND GARDEN BOUNDARIES
    // =================================================

    }else if(sh==='fence'){

        const directions=[
            [1,0],[-1,0],[0,1],[0,-1]
        ];

        const arms=directions.filter(
            (_,i)=>mask&(1<<i)
        );

        if(!arms.length){

            arms.push(
                directions[0],
                directions[1]
            );
        }

        for(const [x,y] of arms){

            if(d==='hedge'){

                for(let i=0;i<4;i++){

                    bush(
                        x*i/7,
                        y*i/7,
                        W,1.35
                    );
                }

            }else if(d==='solid'){

                block(
                    Math.min(0,x*.5)-.045,
                    Math.min(0,y*.5)-.045,
                    Math.max(0,x*.5)+.045,
                    Math.max(0,y*.5)+.045,
                    0,14,W
                );

            }else{

                for(const z of [5,12]){

                    L(
                        [0,0,z],
                        [x*.5,y*.5,z],
                        R,2.3
                    );
                }

                for(let i=0;i<4;i++){

                    L(
                        [x*i/8,y*i/8,0],
                        [x*i/8,y*i/8,17],
                        W,
                        d==='iron'?1.2:2.1
                    );
                }
            }
        }

    // =================================================
    // 10 — DECORATIVE OBJECTS
    // =================================================

    }else if(sh==='decor'){

        if(d==='well'){

            cylinder(
                0,0,0,10,12,W
            );

            oval(0,-10,8,3.5,'#657e7b');

            line(
                [-12,-10],[-12,-30],
                R,2.5
            );

            line(
                [12,-10],[12,-30],
                R,2.5
            );

            poly([
                [-18,-30],
                [0,-44],
                [18,-30]
            ],R);

        }else if(
            d==='pergola'||
            d==='bandstand'
        ){

            base('#d5c9ab');

            for(const [x,y] of [
                [-.32,-.3],
                [.32,-.3],
                [-.32,.3],
                [.32,.3]
            ]){

                L(
                    [x,y,0],
                    [x,y,28],
                    W,3
                );
            }

            if(d==='bandstand'){

                roof(
                    -.38,-.35,.38,.35,
                    28,15,R,true
                );

            }else{

                for(let i=0;i<5;i++){

                    L(
                        [-.36+i*.18,-.35,28],
                        [-.36+i*.18,.35,28],
                        R,2.3
                    );
                }
            }

        }else if(d==='phone'){

            block(
                -.13,-.13,.13,.13,
                0,31,W
            );

            windowAt(
                -.095,.13,8,.19,19
            );

            block(
                -.15,-.15,.15,.15,
                31,4,R
            );

        }else if(d==='post'){

            cylinder(
                0,0,0,22,7,W
            );

            oval(0,-23,7.5,3,R);

            line(
                [-4,-17],[4,-17],
                '#584b44',2
            );

        }else if(d==='birdbath'){

            cylinder(
                0,0,0,12,3,W
            );

            oval(0,-13,12,5,W);
            oval(0,-14,9,3,R);

        }else if(d==='picnic'){

            block(
                -.24,-.18,.24,.18,
                7,3,W
            );

            for(const x of [-.2,.2]){

                L(
                    [x,-.17,0],
                    [x,.17,10],
                    '#876d4f',2
                );
            }

            flat(
                -.29,-.31,.29,-.22,
                W,4
            );

            flat(
                -.29,.22,.29,.31,
                W,4
            );

        }else if(d==='arch'){

            for(const x of [-.27,.27]){

                L(
                    [x,0,0],
                    [x,0,27],
                    W,3
                );

                for(let i=0;i<4;i++){

                    const p=P(x,0,i*7);

                    oval(
                        p[0],p[1],
                        4,3,R
                    );
                }
            }

            L(
                [-.27,0,27],
                [0,0,35],
                R,4
            );

            L(
                [0,0,35],
                [.27,0,27],
                R,4
            );

        }else if(d==='flag'){

            line(
                [0,0],[0,-46],
                W,2
            );

            poly([
                [0,-46],
                [22,-42],
                [22,-30],
                [0,-34]
            ],R);

        }else if(d==='clock'){

            line(
                [0,0],[0,-32],
                R,3
            );

            oval(0,-35,7,8,R);

            oval(0,-35,5.5,6.5,W);

            line(
                [0,-35],[0,-39],
                '#6a5f50',1
            );

            line(
                [0,-35],[3,-34],
                '#6a5f50',1
            );

        }else if(d==='board'){

            for(const x of [-12,12]){

                line(
                    [x,0],[x,-24],
                    W,2
                );
            }

            poly([
                [-15,-9],
                [15,-9],
                [15,-27],
                [-15,-27]
            ],R,W);

        }else if(d==='bridge'){

            flat(
                -.4,-.3,.4,.3,
                '#7ab8c7'
            );

            face([
                [-.45,-.2,5],
                [0,-.2,15],
                [.45,-.2,5],
                [.45,.2,5],
                [0,.2,15],
                [-.45,.2,5]
            ],W);

            L(
                [-.45,.2,6],
                [0,.2,16],
                R,2.4
            );

            L(
                [0,.2,16],
                [.45,.2,6],
                R,2.4
            );

        }else{

            block(
                -.23,-.23,.23,.23,
                0,5,W
            );

            block(
                -.12,-.12,.12,.12,
                5,26,W
            );

            poly([
                [-5,-31],
                [0,-43],
                [5,-31]
            ],R);
        }

    // =================================================
    // 11 — TRANSPORT AND WATERFRONT OBJECTS
    // =================================================

    }else if(sh==='pier'){

        base(R);

        flat(
            -.16,-.48,.16,.48,
            W,4
        );

        flat(
            -.45,-.16,.45,.16,
            W,4
        );

        for(let i=0;i<8;i++){

            const y=-.42+i*.12;

            L(
                [-.16,y,4],
                [.16,y,4],
                '#ad926d',.8
            );
        }

        for(const [x,y] of [
            [-.3,-.28],
            [.3,.28]
        ]){

            const p=P(x,y);

            poly([
                [p[0]-12,p[1]],
                [p[0]+10,p[1]-4],
                [p[0]+13,p[1]],
                [p[0]+4,p[1]+5],
                [p[0]-9,p[1]+4]
            ],'#f0e5d1');

            line(
                [p[0],p[1]],
                [p[0],p[1]-18],
                '#857760',1
            );

            poly([
                [p[0],p[1]-18],
                [p[0]+8,p[1]-2],
                [p[0],p[1]-2]
            ],'#f5e9cd');
        }

    }else if(sh==='vehicle'){

        base('#a8c481');

        block(
            -.33,-.19,.32,.19,
            4,15,W
        );

        block(
            -.35,-.21,.34,.21,
            19,2,R
        );

        for(const x of [-.23,.03]){

            windowAt(
                x,.19,9,.17,8
            );
        }

        for(const x of [-.21,.21]){

            oval(
                ...P(x,.20,3),
                4,4,'#49585c'
            );
        }

    // =================================================
    // 12 — UTILITIES AND INDUSTRY
    // =================================================

    }else if(sh==='power'){

        base('#c4ceba');

        if(d==='tower'||
           d==='weather'){

            for(const [x,y] of [
                [-.18,-.18],
                [.18,-.18],
                [-.18,.18],
                [.18,.18]
            ]){

                L(
                    [x,y,0],
                    [0,0,66],
                    '#8e9d9d',2.4
                );
            }

            for(let z=12;z<65;z+=12){

                L(
                    [-.13,.13,z],
                    [.13,.13,z],
                    R,1.2
                );
            }

            oval(0,-67,5,3,W);

            line(
                [0,-67],[0,-82],
                '#687f84',1.3
            );

        }else if(d==='hydro'||
                 d==='water'){

            oval(0,2,32,14,R);

            block(
                -.4,-.17,.4,.08,
                0,23,W
            );

            for(let i=0;i<4;i++){

                windowAt(
                    -.32+i*.18,
                    .08,6,.12,11
                );
            }

        }else{

            for(const x of [-.22,.22]){

                block(
                    x-.15,-.27,
                    x+.15,.27,
                    0,22,W
                );

                block(
                    x-.17,-.29,
                    x+.17,.29,
                    22,3,R
                );
            }
        }

    }else if(sh==='industrial'){

        base('#c6c5b1');

        cylinder(
            -.3,-.26,
            0,57,5,
            '#b17e64'
        );

        cylinder(
            .02,-.28,
            0,39,5,
            '#b6b7aa'
        );

        for(const x of [-.23,.21]){

            block(
                x-.19,-.29,
                x+.19,.28,
                0,24,W
            );

            roof(
                x-.22,-.33,
                x+.22,.32,
                24,9,R
            );

            windowAt(
                x-.09,.28,8,.18,10
            );
        }

        sign(d,0,.29,20);

    // =================================================
    // 13 — HISTORIC RUINS AND LANDMARKS
    // =================================================

    }else if(sh==='ruins'){

        base('#c5b88f');

        for(const [x,y,h] of [
            [-.3,-.3,27],
            [.3,-.3,33],
            [-.3,.3,17],
            [.3,.3,24]
        ]){

            cylinder(
                x,y,0,h,4.5,W
            );
        }

        block(
            -.4,-.4,.4,-.32,
            0,9,W
        );

        block(
            -.4,-.32,-.32,.36,
            0,12,W
        );

        for(let i=0;i<6;i++){

            oval(
                -20+i*7,
                2+i%2*5,
                4,3,R
            );
        }

    }else if(sh==='lighthouse'){

        base('#d6d2b6');

        const h=d==='small'?30:72;

        cylinder(0,0,0,h,11,W);

        for(let z=10;z<h;z+=23){

            cylinder(
                0,0,z,8,11,R
            );
        }

        cylinder(
            0,0,h,7,13,
            '#9fbfc7'
        );

        poly([
            [-16,-h-7],
            [0,-h-21],
            [16,-h-7]
        ],R);

        oval(
            0,-h-7,14,4,
            tone(R,-20)
        );

        door(0,.23);

    }else if(sh==='dome'){

        base('#d5cbb2');

        block(
            -.36,-.35,.36,.29,
            0,24,W
        );

        for(const x of [-.26,.12]){

            windowAt(
                x,.29,6,.14,12
            );
        }

        g.beginPath();

        g.ellipse(
            0,-27,29,31,
            0,Math.PI,Math.PI*2
        );

        g.closePath();

        g.fillStyle=gradient(
            -30,-58,30,-27,
            tone(R,35),
            tone(R,-30)
        );

        g.fill();

        door(0,.29);

        sign(d,0,.29,22);

    // =================================================
    // 14 — ARCHITECTURAL BUILDING COLLECTION
    // =================================================

    }else{

        const home=
            TYPES[id].group==='Homes';

        base(
            home?'#a8ca80':'#d6c7ab'
        );

        const a=
            sh==='manor'||
            sh==='market'
                ?-.43:-.35;

        const b=-a;
        const back=-.36;
        const front=.23;

        const floors=
            sh==='tower'?5:
            sh==='row'?3:
            sh==='manor'?3:
            sh==='villa'?2:
            sh==='modern'?2:
            sh==='civic'?2:1;

        const h=floors*14+10;

        block(
            a-.02,back-.02,
            b+.02,front+.02,
            0,3,'#d8c5a1'
        );

        block(
            a,back,b,front,
            3,h-3,W
        );

        // Wall and masonry textures.

        for(let z=5;z<h;z+=5){

            L(
                [a,front,z],
                [b,front,z],
                '#92725928',.65
            );

            if(d==='brick'||
               d==='stone'){

                for(let i=0;i<5;i++){

                    const x=
                        a+(b-a)*
                        (i+.3+(z%2)*.3)/5;

                    L(
                        [x,front,z],
                        [x,front,z+4],
                        '#94745a40',.55
                    );
                }
            }
        }

        for(let f=0;f<floors;f++){

            const z=7+f*14;

            windowAt(
                a+.045,front,z,.15,9
            );

            windowAt(
                b-.195,front,z,.15,9
            );

            windowAt(
                b,back+.075,z,
                .14,9,true
            );

            windowAt(
                b,front-.18,z,
                .13,9,true
            );

            if(f>0){

                windowAt(
                    -.06,front,z,.12,9
                );
            }
        }

        door(0,front);

        // Architecture styles.

        if(
            sh==='modern'||
            sh==='tower'||
            sh==='shop'||
            sh==='market'||
            sh==='civic'
        ){

            block(
                a-.04,back-.04,
                b+.04,front+.04,
                h,4,R
            );

            flat(
                a+.04,back+.04,
                b-.04,front-.04,
                tone(R,38),h+4
            );

            block(
                -.15,-.23,.16,.02,
                h+4,5,
                tone(W,-16)
            );

        }else if(sh==='glass'){

            roof(
                a-.03,back-.03,
                b+.03,front+.03,
                h,13,R
            );

            for(let i=0;i<5;i++){

                const x=
                    a+i*(b-a)/4;

                L(
                    [x,front,0],
                    [x,front,h],
                    '#dcebdd',1.6
                );
            }

        }else{

            roof(
                a-.045,back-.045,
                b+.045,front+.055,
                h,
                sh==='manor'?20:16,
                R,
                sh==='villa'||
                sh==='manor'
            );

            block(
                .16,-.24,.25,-.12,
                h+5,14,'#bb896b'
            );
        }

        if(d==='timber'){

            for(const x of [a,0,b]){

                L(
                    [x,front,3],
                    [x,front,h],
                    '#886447',2
                );
            }

            L(
                [a,front,18],
                [b,front,18],
                '#886447',2
            );

        }else if(d==='balcony'||
                 d==='terrace'){

            block(
                -.28,front,.28,front+.12,
                18,2,'#edddbc'
            );

            for(let i=0;i<6;i++){

                const x=-.27+i*.108;

                L(
                    [x,front+.12,20],
                    [x,front+.12,27],
                    '#e9e2c8',1.2
                );
            }

            L(
                [-.28,front+.12,27],
                [.28,front+.12,27],
                '#f9ebcf',1.7
            );

        }else if(d==='columns'||
                 sh==='manor'){

            block(
                -.35,front,.35,.45,
                0,3,'#e0d1b0'
            );

            for(const x of [
                -.29,-.1,.1,.29
            ]){

                L(
                    [x,.42,3],
                    [x,.42,27],
                    '#f3e8cb',3
                );
            }

            face([
                [-.39,.44,27],
                [.39,.44,27],
                [0,.44,36]
            ],W);

        }else if(d==='porch'){

            for(const x of [-.23,.23]){

                L(
                    [x,.38,0],
                    [x,.38,20],
                    '#eaddbd',2.4
                );
            }

            face([
                [-.29,front,22],
                [.29,front,22],
                [.29,.43,17],
                [-.29,.43,17]
            ],R);
        }

        // Individual shopfronts.

        if(sh==='shop'||
           sh==='market'){

            for(let i=0;i<10;i++){

                const x=a+(b-a)*i/10;
                const xx=a+(b-a)*(i+1)/10;

                const col=i%2
                    ?'#fff0cf':R;

                face([
                    [x,front,19],
                    [xx,front,19],
                    [xx,.45,13],
                    [x,.45,13]
                ],col);

                face([
                    [x,.45,13],
                    [xx,.45,13],
                    [xx,.45,10],
                    [x,.45,10]
                ],tone(col,-10));
            }
        }

        if(!home){

            sign(
                d===d.toUpperCase()
                    ?d
                    :TYPES[id].name,
                0,front,
                sh==='shop'?22:24
            );
        }

        flat(
            -.08,front,.08,.49,
            '#e9d6b1'
        );

        bush(
            -.34,.37,
            '#89b866',.85
        );

        bush(
            .34,.37,
            '#85b563',.85
        );

        flower(-.36,.4,'#f2b1c7');

        flower(.36,.4,'#f0d47d');

        if(home){

            flower(-.20,.42,'#f4e2af');

            flower(.20,.42,'#dc9cb6');
        }
    }

    // Keep graphics caching bounded for Chromebooks.

    spriteCache.set(cacheKey,c);

    if(spriteCache.size>80){

        spriteCache.delete(
            spriteCache.keys().next().value
        );
    }

    return c;
}

// =====================================================
// 15 — AUTOMATIC FENCE CONNECTIONS
// =====================================================

const fenceTypes=new Set([
    'woodFence',
    'whiteFence',
    'stoneWall',
    'ironFence',
    'hedge',
    ...Object.keys(artwork).filter(
        id=>artwork[id].shape==='fence'
    )
]);

function fenceMask(x,y){

    let mask=0;

    [
        [1,0],[-1,0],
        [0,1],[0,-1]
    ].forEach(([a,b],i)=>{

        const id=town.buildings[
            key(x+a,y+b)
        ]?.type;

        if(fenceTypes.has(id)){

            mask|=1<<i;
        }
    });

    return mask;
}

// =====================================================
// 16 — CONNECT NEW GRAPHICS TO EXISTING WORLD
// =====================================================

drawObject=function(t){

    const k=key(t.x,t.y);

    const id=town.buildings[k]?.type;

    if(!artwork[id]){

        return previousDraw(t);
    }

    const p=project(t.x,t.y);

    const mask=
        artwork[id].shape==='fence'
            ?fenceMask(t.x,t.y)
            :0;

    ctx.save();

    if(moving===k){

        ctx.globalAlpha=.45;
    }

    ctx.drawImage(
        getSprite(id,mask),
        p[0]-64,
        p[1]-122,
        128,152
    );

    ctx.restore();
};

// =====================================================
// 17 — REORGANISE EXISTING BUILDINGS
// =====================================================

const remap={

    clinic:'Healthcare',
    hospital:'Healthcare',
    pharmacy:'Healthcare',
    ambulance:'Healthcare',

    cafe:'Food and drink',
    bakery:'Food and drink',
    restaurant:'Food and drink',
    icecream:'Food and drink',
    pub:'Food and drink',
    butcher:'Food and drink',

    wheel:'Funfair',
    carousel:'Funfair',
    playground:'Leisure',

    stadium:'Sports',
    pool:'Sports',
    tennis:'Sports',

    festival:'Festivals',

    aquarium:'Wildlife',
    harbour:'Waterfront',

    school:'Education',
    library:'Education',
    nationalLibrary:'Education',
    nursery:'Education',
    university:'Education',
    college:'Education',
    secondary:'Education',

    hotel:'Tourism',
    resort:'Tourism',
    guesthouse:'Tourism',

    barn:'Agriculture',
    farm:'Agriculture',
    farmhouse:'Agriculture',
    greenhouse:'Agriculture',

    army:'Civic',
    prison:'Civic'

};

function sectionOf(id,t){

    return remap[id]||
        t.section||
        ({
            Homes:'Homes',
            Business:'Shops',
            Services:'Civic',
            Farming:'Agriculture',
            Industry:'Industry',
            Utilities:'Utilities',
            Nature:'Nature',
            Roads:'Roads'
        })[t.group]||
        t.group;
}

const sections=[

    'Homes',
    'Shops',
    'Food and drink',
    'Civic',
    'Healthcare',
    'Education',
    'Tourism',
    'Funfair',
    'Wildlife',
    'Sports',
    'Leisure',
    'Festivals',
    'Faith',
    'Transport',
    'Waterfront',
    'Roads',
    'Agriculture',
    'Industry',
    'Utilities',
    'Nature',
    'Fences',
    'Decoration'

];

// =====================================================
// 18 — SEARCHABLE PAGINATED CATALOGUE
// =====================================================

let section='Homes';

let query='';

let page=0;

const pageSize=24;

// Remove previous search event handlers safely.

const previousSearch=$('v5search');

const search=previousSearch.cloneNode(true);

previousSearch.replaceWith(search);

search.value='';

search.placeholder='Search the entire catalogue…';

const counter=$('v5count');

const bar=$('v5bar');

const pagination=document.createElement('div');

pagination.id='v6page';

const previous=document.createElement('button');

previous.textContent='◀';

previous.setAttribute(
    'aria-label',
    'Previous catalogue page'
);

const next=document.createElement('button');

next.textContent='▶';

next.setAttribute(
    'aria-label',
    'Next catalogue page'
);

const pageLabel=document.createElement('span');

pagination.append(
    previous,
    pageLabel,
    next
);

bar.insertBefore(
    pagination,
    $('v5toggle')
);

function getPreview(id){

    const c=document.createElement('canvas');

    c.width=132;
    c.height=104;

    const g=c.getContext('2d');

    if(artwork[id]){

        const image=getSprite(id);

        g.drawImage(
            image,
            32,22,192,272,
            26,0,80,104
        );

    }else if(previousPreviews.has(id)){

        g.drawImage(
            previousPreviews.get(id),
            2,0,128,104
        );

    }else{

        g.font='34px sans-serif';

        g.textAlign='center';

        g.fillText(
            TYPES[id].icon||'🌱',
            66,66
        );
    }

    return c;
}

function entries(){

    return Object.entries(TYPES)

        .filter(([id,t])=>{

            if(query){

                const text=(
                    t.name+' '+
                    sectionOf(id,t)
                ).toLowerCase();

                return query
                    .split(/\s+/)
                    .every(
                        word=>text.includes(word)
                    );
            }

            return sectionOf(id,t)===section;

        })

        .sort((a,b)=>
            a[1].name.localeCompare(b[1].name)
        );
}

function showCatalogue(){

    catalogue.replaceChildren();

    const results=entries();

    const maxPage=Math.max(
        0,
        Math.ceil(
            results.length/pageSize
        )-1
    );

    page=Math.min(page,maxPage);

    const start=page*pageSize;

    const shown=results.slice(
        start,start+pageSize
    );

    counter.textContent=
        results.length+' items';

    pageLabel.textContent=
        (page+1)+' / '+(maxPage+1);

    previous.disabled=page===0;

    next.disabled=page===maxPage;

    for(const [id,t] of shown){

        const card=document.createElement(
            'button'
        );

        card.className='item';
        card.dataset.type=id;

        card.append(getPreview(id));

        const name=document.createElement(
            'span'
        );

        name.textContent=t.name;

        const price=document.createElement(
            'small'
        );

        price.textContent=
            money(t.cost)+
            (
                t.rent
                    ?' · +'+money(t.rent)
                    :''
            );

        card.append(name,price);

        card.title=

            t.name+
            ' | Construction: '+money(t.cost)+

            (
                t.rent
                    ?' | Income: '+money(t.rent)
                    :''
            )+

            (
                t.pop
                    ?' | Residents: '+t.pop
                    :''
            );

        card.onclick=()=>{

            selected=id;

            selectMode('build');
        };

        if(
            mode==='build'&&
            selected===id
        ){

            card.classList.add('active');
        }

        catalogue.append(card);
    }

    if(!shown.length){

        const empty=document.createElement(
            'span'
        );

        empty.textContent=
            'No matching buildings found.';

        empty.style.padding='15px';

        catalogue.append(empty);
    }

    catalogue.scrollLeft=0;
}

function showCategories(){

    tabs.replaceChildren();

    for(const label of sections){

        const b=document.createElement(
            'button'
        );

        const count=Object.entries(TYPES)
            .filter(([id,t])=>
                sectionOf(id,t)===label
            ).length;

        b.textContent=
            label+' ('+count+')';

        b.className=
            label===section&&!query
                ?'chosen'
                :'';

        b.onclick=()=>{

            section=label;
            query='';
            page=0;

            search.value='';

            selectMode('pan');

            showCategories();
            showCatalogue();
        };

        tabs.append(b);
    }
}

search.addEventListener('input',()=>{

    query=search.value
        .trim()
        .toLowerCase();

    page=0;

    showCategories();
    showCatalogue();
});

previous.onclick=()=>{

    if(page>0){

        page--;

        showCatalogue();
    }
};

next.onclick=()=>{

    page++;

    showCatalogue();
};

// =====================================================
// 19 — BUILDING INFORMATION
// =====================================================

selectMode=function(m){

    previousMode(m);

    if(m==='build'&&TYPES[selected]){

        const t=TYPES[selected];

        message(

            t.name+
            ' • Build '+money(t.cost)+

            (
                t.rent
                    ?' • Income '+money(t.rent)+'/10s'
                    :''
            )+

            (
                t.pop
                    ?' • Capacity '+t.pop
                    :''
            )+

            ' • Tap empty land to construct'
        );
    }
};

// =====================================================
// 20 — IMPROVED CATALOGUE INTERFACE
// =====================================================

const css=document.createElement('style');

css.textContent=`

#dock{

    max-width:1100px;
}

#categories{

    gap:5px;

    overflow-x:auto;

    padding-bottom:5px;
}

#categories button{

    white-space:nowrap;

    border-radius:9px;

    padding:7px 10px;

    font-size:11px;

    font-weight:750;
}

#categories .chosen{

    background:
        linear-gradient(
            #a4d39a,
            #7cba82
        );

    border-color:#669f70;

    color:#284f38;
}

#catalogue{

    padding:4px 1px 6px;

    gap:8px;
}

#catalogue .item{

    flex:0 0 119px;

    height:138px;

    min-height:138px;

    grid-template-rows:
        86px 29px 13px;

    background:
        linear-gradient(
            #fffbef,
            #f0e3c9
        );

    border-radius:12px;

    border:1px solid #bca688;

    padding:3px;
}

#catalogue .item canvas{

    width:106px;

    height:85px;

    object-fit:contain;
}

#catalogue .item span{

    font-size:11px;

    font-weight:750;

    line-height:1.15;

    text-align:center;

    display:grid;

    place-items:center;
}

#catalogue .item small{

    color:#52734e;

    font-size:10px;
}

#catalogue .item.active{

    border:2px solid #d8a048;

    background:
        linear-gradient(
            #fff6d5,
            #f5e5a7
        );
}

#v6page{

    display:flex;

    align-items:center;

    gap:6px;

    font-size:11px;

    color:#72563d;
}

#v6page button{

    background:#dec7a6;

    border-radius:6px;

    color:#6d543c;

    padding:5px 8px;
}

#v6page button:disabled{

    opacity:.35;

    cursor:default;
}

#dock.v5collapsed #v6page{

    display:none;
}

#v5search{

    min-width:100px;
}

@media(max-height:480px){

    #catalogue .item{

        height:96px;

        min-height:96px;

        grid-template-rows:
            45px 29px 12px;
    }

    #catalogue .item canvas{

        width:66px;

        height:44px;
    }
}

`;

document.head.append(css);

// =====================================================
// 21 — ACTIVATE VERSION 0.6
// =====================================================

showCategories();

showCatalogue();

selectMode('pan');

hud();

save();

dirty=true;

const total=Object.keys(TYPES).length;

const added=total-previousCount;

message(

    'Catalogue expanded! '+
    added+' new items • '+
    total+' total construction options'

);

document.title=
    'Town Builder • Ultimate Catalogue';

console.log(

    'Town Builder V0.6 loaded',

    {
        previousCount,
        added,
        total,
        categories:sections.length
    }
);

})();
