export type DirectoryListing = {
  name: string;
  href: string;
  detail: string;
  note?: string;
};

export type DirectoryShelf = {
  id: string;
  title: string;
  intro: string;
  items: DirectoryListing[];
};

/** Facebook groups and pages from the community spreadsheet. Member counts are approximate. */
export const directorySource = 'https://docs.google.com/spreadsheets/d/1DfTKkDGq_t7sl39fSgEVmoqlp820I03hynDusuVJTIA/edit?gid=2113067166#gid=2113067166';

export const directoryShelves: DirectoryShelf[] = [
  {
    "id": "whats-happening",
    "title": "What's happening",
    "intro": "General rooms for news, questions, and day-to-day county talk.",
    "items": [
      {
        "name": "Living in Bastrop County",
        "href": "https://www.facebook.com/groups/bastropcountytx",
        "detail": "Public · about 36,000 members · Bastrop County"
      },
      {
        "name": "Bastrop County Foodies",
        "href": "https://www.facebook.com/groups/bastropcountyfoodies",
        "detail": "Public · about 26,000 members · Bastrop County"
      },
      {
        "name": "Bastrop Texas",
        "href": "https://www.facebook.com/groups/314557095384347",
        "detail": "Private · about 25,000 members · Bastrop · about 80 posts a day"
      },
      {
        "name": "Totally Free Bastrop/ Helpful Info",
        "href": "https://www.facebook.com/groups/694412308143544",
        "detail": "Public · about 23,000 members · Bastrop · 10+ posts a day"
      },
      {
        "name": "Bastrop County Scanner Group",
        "href": "https://www.facebook.com/groups/bastropcountyscanner",
        "detail": "Public · about 14,000 members · Bastrop County · about 2 posts a day"
      },
      {
        "name": "Cedar Creek & Bastrop Texas Community & Yard Sale",
        "href": "https://www.facebook.com/groups/CedarCreekBastropOnlineYardSale",
        "detail": "Public · about 13,000 members · Cedar Creek"
      },
      {
        "name": "365 Bastrop - Fun in Bastrop County, TX",
        "href": "https://www.facebook.com/groups/365FunInBastropCounty",
        "detail": "Public · about 12,000 members · Bastrop County · about 7 posts a day"
      },
      {
        "name": "Life in Bastrop",
        "href": "https://www.facebook.com/groups/1360235892188288",
        "detail": "Public · about 12,000 members · Bastrop"
      },
      {
        "name": "Bastrop Bulletin Board",
        "href": "https://www.facebook.com/groups/BastropBulletinBoard",
        "detail": "Private · about 7,900 members · Bastrop · about 5 posts a day"
      },
      {
        "name": "Everything Bastrop TX",
        "href": "https://www.facebook.com/groups/24492050793794111",
        "detail": "Public · about 7,800 members · Bastrop"
      },
      {
        "name": "Bastrop TX and Surrounding Areas of Bastrop",
        "href": "https://www.facebook.com/groups/245031032740970",
        "detail": "Private · about 5,300 members · Bastrop · about 4 posts a day"
      },
      {
        "name": "Bastrop County & Surrounding Communities",
        "href": "https://www.facebook.com/groups/1002466935248864",
        "detail": "Public · about 4,000 members · Bastrop County"
      },
      {
        "name": "Cedar Creek/Bastrop Community & Surrounding Areas Friends",
        "href": "https://www.facebook.com/groups/cedarcreekbastropcommunity",
        "detail": "Public · about 3,600 members · Cedar Creek · 10+ posts a day"
      },
      {
        "name": "TEXAS Bastrop Smithville La Grange Elgin Austin Cedar Creek",
        "href": "https://www.facebook.com/groups/1296721794002570",
        "detail": "Private · about 3,500 members · Regional · 10+ posts a day"
      },
      {
        "name": "Bastrop Connect: Share, Celebrate, & Connect",
        "href": "https://www.facebook.com/groups/bastropconnect",
        "detail": "Public · about 3,300 members · Bastrop · about 10 posts a day"
      },
      {
        "name": "New to Bastrop County",
        "href": "https://www.facebook.com/groups/940747607387502",
        "detail": "Public · about 1,300 members · Bastrop County"
      },
      {
        "name": "City Guide: Bastrop, Texas",
        "href": "https://www.facebook.com/groups/cityguide.bastrop.texas",
        "detail": "Public · about 881 members · Bastrop"
      },
      {
        "name": "What's Happening in Bastrop County, TX - Bastrop Current",
        "href": "https://www.facebook.com/groups/bastropcurrent",
        "detail": "Public · about 747 members · Bastrop County · about 7 posts a day"
      },
      {
        "name": "LIVE LOVE BASTROP",
        "href": "https://www.facebook.com/groups/1447068099593684",
        "detail": "Public · about 631 members · Bastrop"
      },
      {
        "name": "Bastrop County Living",
        "href": "https://www.facebook.com/groups/25994251436893942",
        "detail": "Public · about 612 members · Bastrop County · about 6 posts a day"
      },
      {
        "name": "Heart of Texas Connect - Smithville, Bastrop, La Grange",
        "href": "https://www.facebook.com/groups/heartoftexasconnect",
        "detail": "Public · about 546 members · Regional · about 4 posts a day"
      },
      {
        "name": "bastrop/camp swift what's going on around town",
        "href": "https://www.facebook.com/groups/3604218266302598",
        "detail": "Public · about 487 members · Camp Swift"
      },
      {
        "name": "Bastrop County Resource Guide",
        "href": "https://www.facebook.com/groups/bastropreloguide",
        "detail": "Public · about 448 members · Bastrop County"
      },
      {
        "name": "BastropTX Positivity Project",
        "href": "https://www.facebook.com/groups/999808939302602",
        "detail": "Public · about 355 members · Bastrop"
      },
      {
        "name": "What's happening in or around Bastrop county",
        "href": "https://www.facebook.com/groups/1194132712485767",
        "detail": "Public · about 352 members · Bastrop County · about 2 posts a day"
      },
      {
        "name": "Highway 21 East: Bastrop To Paige",
        "href": "https://www.facebook.com/groups/1564741053822664",
        "detail": "Public · about 257 members · Paige"
      },
      {
        "name": "Moving To Bastrop, Texas",
        "href": "https://www.facebook.com/groups/460748046751999",
        "detail": "Public · about 234 members · Bastrop"
      },
      {
        "name": "Bastropia",
        "href": "https://www.facebook.com/groups/bastropia",
        "detail": "Public · about 98 members · Bastrop County · neighbors posting news, weekend plans, roads, and burn bans"
      }
    ]
  },
  {
    "id": "elgin",
    "title": "Elgin",
    "intro": "Rooms based in Elgin.",
    "items": [
      {
        "name": "Selling in Manor Tx And Elgin Tx",
        "href": "https://www.facebook.com/groups/395030503002423",
        "detail": "Public · about 30,000 members · Elgin/Manor · 90+ posts a day"
      },
      {
        "name": "Elgin, TX - Community Group",
        "href": "https://www.facebook.com/groups/ElginTXCommunity",
        "detail": "Private · about 22,000 members · Elgin · 30+ posts a day"
      },
      {
        "name": "Elgin Marketplace, Elgin Texas",
        "href": "https://www.facebook.com/groups/1771104416408281",
        "detail": "Public · about 12,000 members · Elgin · 90+ posts a day"
      },
      {
        "name": "Manor/Elgin Texas Lost and Found Pets",
        "href": "https://www.facebook.com/groups/Manor.ElginLostandFoundPets",
        "detail": "Public · about 12,000 members · Elgin/Manor · about 5 posts a day"
      },
      {
        "name": "Elgin, Texas online yard sale",
        "href": "https://www.facebook.com/groups/399976473395054",
        "detail": "Private · about 9,500 members · Elgin · 30+ posts a day"
      },
      {
        "name": "78621 Elgin, Texas",
        "href": "https://www.facebook.com/groups/268979170719080",
        "detail": "Private · about 8,200 members · Elgin · 10+ posts a day"
      },
      {
        "name": "Elgin community",
        "href": "https://www.facebook.com/groups/447109762593939",
        "detail": "Public · about 6,600 members · Elgin · 40+ posts a day"
      },
      {
        "name": "Elgin, TX - Community Sales Group",
        "href": "https://www.facebook.com/groups/elgintxcommunitysales",
        "detail": "Private · about 6,200 members · Elgin · about 7 posts a day"
      },
      {
        "name": "Small Town Small Businesses: Elgin",
        "href": "https://www.facebook.com/groups/700423867399301",
        "detail": "Public · about 5,200 members · Elgin · about 9 posts a day"
      },
      {
        "name": "Elgin, Texas Business Pages",
        "href": "https://www.facebook.com/groups/152471171107126",
        "detail": "Public · about 4,200 members · Elgin · about 4 posts a day"
      },
      {
        "name": "Elgin, Texas: Buy, Sell, Trade",
        "href": "https://www.facebook.com/groups/1629414373973886",
        "detail": "Public · about 4,000 members · Elgin · about 5 posts a day"
      },
      {
        "name": "FM 1704, Elgin, Texas",
        "href": "https://www.facebook.com/groups/1803853976500658",
        "detail": "Private · about 1,900 members · Elgin · about 7 posts a day"
      },
      {
        "name": "Elgin TX community group",
        "href": "https://www.facebook.com/groups/1020058122550982",
        "detail": "Private · about 1,600 members · Elgin · about 5 posts a day"
      },
      {
        "name": "Elgin, Texas",
        "href": "https://www.facebook.com/groups/3862194094038531",
        "detail": "Public · about 1,300 members · Elgin · about 9 posts a day"
      },
      {
        "name": "Elgin Wildcat Athletic Booster Club",
        "href": "https://www.facebook.com/groups/156851964453665",
        "detail": "Public · about 1,000 members · Elgin"
      }
    ]
  },
  {
    "id": "smithville",
    "title": "Smithville",
    "intro": "Rooms based in Smithville.",
    "items": [
      {
        "name": "La Grange, Giddings, Smithville, And Surrounding",
        "href": "https://www.facebook.com/groups/710447252326417",
        "detail": "Public · about 43,000 members · Regional · 90+ posts a day"
      },
      {
        "name": "Smithville Swap N' Sell!",
        "href": "https://www.facebook.com/groups/305248106264977",
        "detail": "Public · about 15,000 members · Smithville · 90+ posts a day",
        "note": "Confirm this is Smithville, Texas, not another Smithville."
      },
      {
        "name": "For sale or trade in SMITHVILLE TX",
        "href": "https://www.facebook.com/groups/562362010479858",
        "detail": "Private · about 5,000 members · Smithville · 20+ posts a day"
      },
      {
        "name": "Get it and Give it in Smithville",
        "href": "https://www.facebook.com/groups/getitandgiveitsmithville",
        "detail": "Private · about 2,900 members · Smithville · 10+ posts a day"
      },
      {
        "name": "Smithville Online Garage Sale",
        "href": "https://www.facebook.com/groups/567821096585723",
        "detail": "Private · about 2,900 members · Smithville · about 5 posts a day"
      },
      {
        "name": "Freeville Smithville",
        "href": "https://www.facebook.com/groups/161612385525415",
        "detail": "Private · about 1,800 members · Smithville"
      },
      {
        "name": "Smithville Swap And Share",
        "href": "https://www.facebook.com/groups/1008863882956545",
        "detail": "Private · about 1,400 members · Smithville"
      },
      {
        "name": "Backstage Pass for Smithville Tiger Sports",
        "href": "https://www.facebook.com/groups/smithville",
        "detail": "Public · about 1,300 members · Smithville"
      },
      {
        "name": "TWIG: A Fun Place to Shop in Smithville",
        "href": "https://www.facebook.com/groups/571217051975668",
        "detail": "Public · about 1,300 members · Smithville"
      },
      {
        "name": "Smithville ISD Parents",
        "href": "https://www.facebook.com/groups/548555415774767",
        "detail": "Private · about 1,000 members · Smithville"
      }
    ]
  },
  {
    "id": "cedar-creek",
    "title": "Cedar Creek",
    "intro": "The community room for Cedar Creek.",
    "items": [
      {
        "name": "Cedar Creek, TX",
        "href": "https://www.facebook.com/groups/1708557466570327",
        "detail": "Private · about 8,100 members · Cedar Creek",
        "note": "Confirm this is Cedar Creek in Bastrop County, not Cedar Creek Lake."
      }
    ]
  },
  {
    "id": "neighborhoods",
    "title": "Neighborhoods",
    "intro": "Subdivision and small-community rooms.",
    "items": [
      {
        "name": "The Colony In Bastrop, Texas",
        "href": "https://www.facebook.com/groups/thecolonybastrop",
        "detail": "Private · about 2,700 members · The Colony · about 8 posts a day"
      },
      {
        "name": "Tahitian Village, Bastrop TX UPDATES",
        "href": "https://www.facebook.com/groups/137391903022787",
        "detail": "Private · about 2,600 members · Tahitian Village · about 2 posts a day"
      },
      {
        "name": "Pecan Park, Bastrop, TX - Community Group",
        "href": "https://www.facebook.com/groups/860157097458440",
        "detail": "Private · about 1,300 members · Pecan Park · about 5 posts a day"
      },
      {
        "name": "Hunters Crossing, Bastrop, TX - Official Page",
        "href": "https://www.facebook.com/groups/Bastrop.Tx.Hunters.Crossing",
        "detail": "Private · about 1,200 members · Hunters Crossing · about 3 posts a day"
      },
      {
        "name": "Pecan Park Community Residents",
        "href": "https://www.facebook.com/groups/778889837727857",
        "detail": "Public · about 522 members · Pecan Park"
      },
      {
        "name": "Pine Forest in Bastrop, Texas",
        "href": "https://www.facebook.com/groups/246188132414640",
        "detail": "Public · about 313 members · Pine Forest"
      },
      {
        "name": "valverde bastrop tx",
        "href": "https://www.facebook.com/groups/529705696880411",
        "detail": "Public · about 219 members · Valverde"
      },
      {
        "name": "Valverde, Bastrop TX, Community Group",
        "href": "https://www.facebook.com/groups/1579295086458072",
        "detail": "Private · about 202 members · Valverde · about 2 posts a day"
      },
      {
        "name": "Utley, TX and surrounding areas of Bastrop Co",
        "href": "https://www.facebook.com/groups/653156568453918",
        "detail": "Public · about 170 members · Utley"
      },
      {
        "name": "Hills Prairie Community Page (Bastrop)",
        "href": "https://www.facebook.com/groups/1757799261584662",
        "detail": "Public · about 70 members · Hills Prairie"
      }
    ]
  },
  {
    "id": "buy-sell",
    "title": "Buy, sell, and free",
    "intro": "Yard sales, free stuff, and buy-sell-trade.",
    "items": [
      {
        "name": "Bastrop TX Buy, Sell and Trade",
        "href": "https://www.facebook.com/groups/bastroptxbuysellandtrade",
        "detail": "Private · about 18,000 members · Bastrop · 20+ posts a day"
      },
      {
        "name": "For free, sale or trade in Bastrop County",
        "href": "https://www.facebook.com/groups/ForFreeSaleorTradeinBastropCounty",
        "detail": "Private · about 18,000 members · Bastrop County · 10+ posts a day"
      },
      {
        "name": "Bastrop, Texas: Buy, Sell, Trade And Social Group",
        "href": "https://www.facebook.com/groups/1542320059365705",
        "detail": "Private · about 16,000 members · Bastrop"
      },
      {
        "name": "Bastrop community sale page",
        "href": "https://www.facebook.com/groups/323696332461883",
        "detail": "Public · about 12,000 members · Bastrop · 60+ posts a day"
      },
      {
        "name": "Buy, Sell or Trade in Bastrop & Fayette County",
        "href": "https://www.facebook.com/groups/175170572656867",
        "detail": "Private · about 12,000 members · Regional · 10+ posts a day"
      },
      {
        "name": "Compra&Venta Area De Bastrop&Elgin",
        "href": "https://www.facebook.com/search/groups/?q=Compra%26Venta%20Area%20De%20Bastrop%26Elgin",
        "detail": "Public · about 12,000 members · Bastrop/Elgin",
        "note": "Spanish-language. No direct link was on the list. This opens a Facebook search for the name."
      },
      {
        "name": "FREE Stuff & More in Bastrop County & Area",
        "href": "https://www.facebook.com/groups/1429936547253239",
        "detail": "Public · about 11,000 members · Bastrop County · 30+ posts a day"
      },
      {
        "name": "Sale, Buy Or Trade In Bastrop county",
        "href": "https://www.facebook.com/groups/259902530847229",
        "detail": "Public · about 10,000 members · Bastrop County · 10+ posts a day"
      },
      {
        "name": "Bastrop County Texas Garage Sales",
        "href": "https://www.facebook.com/groups/184008641671540",
        "detail": "Private · about 9,700 members · Bastrop County · 20+ posts a day"
      },
      {
        "name": "BUY, SALE & TRADE: BASTROP TEXAS",
        "href": "https://www.facebook.com/groups/irmawade",
        "detail": "Private · about 9,600 members · Bastrop · 20+ posts a day"
      },
      {
        "name": "Bastrop TX Wanted (ISO)",
        "href": "https://www.facebook.com/groups/174201539431747",
        "detail": "Public · about 9,300 members · Bastrop · about 9 posts a day"
      },
      {
        "name": "Bastrop County Texas Yard Sale",
        "href": "https://www.facebook.com/groups/465731696953972",
        "detail": "Public · about 8,100 members · Bastrop County · 30+ posts a day"
      },
      {
        "name": "Barter, Sale, Buy, & Trade: Smithville, Bastrop",
        "href": "https://www.facebook.com/groups/1527791274192345",
        "detail": "Public · about 7,900 members · Smithville/Bastrop"
      },
      {
        "name": "Bastrop County Trading Post",
        "href": "https://www.facebook.com/groups/395121440602494",
        "detail": "Public · about 7,800 members · Bastrop County · 80+ posts a day"
      },
      {
        "name": "Bastrop Daily Buy, Sell, Trade",
        "href": "https://www.facebook.com/groups/BastropDaily",
        "detail": "Private · about 6,800 members · Bastrop"
      },
      {
        "name": "Bastrop County Buy and Sell",
        "href": "https://www.facebook.com/groups/SmithvilleBuySell",
        "detail": "Private · about 6,400 members · Bastrop County"
      },
      {
        "name": "SELL ANYTHING (Giddings, Smithville, Bastrop, La Grange TX)",
        "href": "https://www.facebook.com/groups/577585965710632",
        "detail": "Private · about 6,000 members · Regional · 50+ posts a day"
      },
      {
        "name": "Bastrop County TX (surrounding area) for FREE or Trade",
        "href": "https://www.facebook.com/groups/359588754242429",
        "detail": "Public · about 5,600 members · Bastrop County"
      },
      {
        "name": "Bastrop County Bazaar",
        "href": "https://www.facebook.com/groups/BastropCountyTxBazaar",
        "detail": "Public · about 4,700 members · Bastrop County · about 5 posts a day"
      },
      {
        "name": "Buy Nothing - Elgin and Bastrop",
        "href": "https://www.facebook.com/groups/395236744888132",
        "detail": "Public · about 3,900 members · Bastrop/Elgin"
      },
      {
        "name": "Buy Nothing Project - Bastrop Area",
        "href": "https://www.facebook.com/groups/614662972607665",
        "detail": "Private · about 3,800 members · Bastrop · about 4 posts a day"
      },
      {
        "name": "Baby & Kids Buy, Sell, & Trade - Bastrop TX",
        "href": "https://www.facebook.com/groups/BastropTxKids",
        "detail": "Public · about 2,700 members · Bastrop · 10+ posts a day"
      },
      {
        "name": "Bastrop County Outdoors, BUY, SELL, TRADE",
        "href": "https://www.facebook.com/groups/622340804591177",
        "detail": "Public · about 2,700 members · Bastrop County · 10+ posts a day"
      },
      {
        "name": "Bastrop County Texas only Wanted To Buy, Sell, Trade, Free",
        "href": "https://www.facebook.com/groups/560559327344762",
        "detail": "Public · about 2,700 members · Bastrop County · 10+ posts a day"
      },
      {
        "name": "Bastrop Free Stuff",
        "href": "https://www.facebook.com/groups/958451812636073",
        "detail": "Public · about 2,700 members · Bastrop · about 2 posts a day"
      },
      {
        "name": "Bastrop Mom's Closet Clean Out",
        "href": "https://www.facebook.com/groups/bmcco",
        "detail": "Private · about 2,600 members · Bastrop · 20+ posts a day"
      },
      {
        "name": "Bastrop Garage Sale Items/Anything",
        "href": "https://www.facebook.com/groups/826311810810012",
        "detail": "Private · about 2,500 members · Bastrop · 10+ posts a day"
      },
      {
        "name": "(MONITORED) Bastrop County and Surrounding Counties Buy, Sell",
        "href": "https://www.facebook.com/groups/2462691204021648",
        "detail": "Public · about 2,000 members · Bastrop County · about 3 posts a day"
      },
      {
        "name": "Bastrop County Online Flea Market",
        "href": "https://www.facebook.com/groups/BastropCountyOnlineFleaMarket",
        "detail": "Private · about 1,900 members · Bastrop County · 10+ posts a day"
      },
      {
        "name": "Gratis Area De Bastrop&Elgin",
        "href": "https://www.facebook.com/groups/861365227689233",
        "detail": "Public · about 1,900 members · Bastrop/Elgin",
        "note": "Spanish-language."
      },
      {
        "name": "BASTROP CARS, TRUCKS and RV's FOR SALE",
        "href": "https://www.facebook.com/groups/bastropcarstrucks",
        "detail": "Public · about 1,800 members · Bastrop · about 5 posts a day"
      },
      {
        "name": "Garage Sales Only - Bastrop County Texas & Surrounding",
        "href": "https://www.facebook.com/groups/462148774234915",
        "detail": "Public · about 1,500 members · Bastrop County"
      },
      {
        "name": "Bastrop County Stock Sale, For Sale, Trade",
        "href": "https://www.facebook.com/groups/765821993550458",
        "detail": "Private · about 1,300 members · Bastrop County · about 2 posts a day"
      }
    ]
  },
  {
    "id": "homes",
    "title": "Homes",
    "intro": "Places for sale and for rent.",
    "items": [
      {
        "name": "Homes for Sale & Rent in Bastrop County Texas",
        "href": "https://www.facebook.com/groups/746203898753770",
        "detail": "Private · about 9,400 members · Bastrop County"
      },
      {
        "name": "Bastrop TX For Rent",
        "href": "https://www.facebook.com/groups/625498537481510",
        "detail": "Public · about 7,100 members · Bastrop · about 10 posts a day"
      },
      {
        "name": "Homes for Sale or Rent in Bastrop, Elgin, & Manor",
        "href": "https://www.facebook.com/groups/170209377030402",
        "detail": "Public · about 3,700 members · Regional"
      },
      {
        "name": "For Rent In Bastrop Texas",
        "href": "https://www.facebook.com/groups/716609968374135",
        "detail": "Public · about 2,900 members · Bastrop"
      },
      {
        "name": "Bastrop County House's For Rent",
        "href": "https://www.facebook.com/groups/519403658128101",
        "detail": "Public · about 2,000 members · Bastrop County"
      },
      {
        "name": "Bastrop Real Estate For Sale & Rent (Texas)",
        "href": "https://www.facebook.com/groups/3874619136188008",
        "detail": "Public · about 1,000 members · Bastrop · about 3 posts a day"
      },
      {
        "name": "Bastrop County Real Estate. Homes For Sale. Buy/Sell Land",
        "href": "https://www.facebook.com/groups/bastroprealestate",
        "detail": "Public · about 605 members · Bastrop County"
      }
    ]
  },
  {
    "id": "jobs",
    "title": "Jobs and businesses",
    "intro": "Job posts and rooms where local businesses advertise.",
    "items": [
      {
        "name": "Bastrop, TX - Job Board",
        "href": "https://www.facebook.com/groups/524698045280795",
        "detail": "Public · about 5,800 members · Bastrop · about 2 posts a day"
      },
      {
        "name": "Bastrop TX Advertise Your Local Business",
        "href": "https://www.facebook.com/groups/214055958758962",
        "detail": "Public · about 4,800 members · Bastrop · 20+ posts a day"
      },
      {
        "name": "Bastrop County Businesses",
        "href": "https://www.facebook.com/groups/627678983945898",
        "detail": "Public · about 2,600 members · Bastrop County · 10+ posts a day"
      },
      {
        "name": "Bastrop County Networking - Local Business",
        "href": "https://www.facebook.com/groups/bastropcountynetworking",
        "detail": "Public · about 2,500 members · Bastrop County"
      },
      {
        "name": "Jobs in Bastrop County, Texas",
        "href": "https://www.facebook.com/groups/666619750204990",
        "detail": "Public · about 2,000 members · Bastrop County"
      },
      {
        "name": "Bastrop Contractor Connection",
        "href": "https://www.facebook.com/groups/833698938336491",
        "detail": "Public · about 1,300 members · Bastrop · about 4 posts a day"
      },
      {
        "name": "Small business Services - Bastrop county & surrounding",
        "href": "https://www.facebook.com/groups/484170668356598",
        "detail": "Public · about 711 members · Bastrop County · about 2 posts a day"
      },
      {
        "name": "Bastrop Texas and Surrounding Counties Reputable (businesses)",
        "href": "https://www.facebook.com/groups/555115694864429",
        "detail": "Public · about 558 members · Bastrop County"
      },
      {
        "name": "Bastrop Business Directory",
        "href": "https://www.facebook.com/groups/1269027494774382",
        "detail": "Public · about 240 members · Bastrop"
      }
    ]
  },
  {
    "id": "parents",
    "title": "Parents and families",
    "intro": "Parents, kids, babysitters, and caregivers.",
    "items": [
      {
        "name": "Bastrop Texas and surrounding areas Mom's Group",
        "href": "https://www.facebook.com/groups/bastropmoms",
        "detail": "Private · about 4,000 members · Bastrop · about 6 posts a day"
      },
      {
        "name": "Bastrop & surrounding area babysitters",
        "href": "https://www.facebook.com/search/groups/?q=Bastrop%20%26%20surrounding%20area%20babysitters",
        "detail": "Private · about 2,200 members · Bastrop",
        "note": "No direct link was on the list. This opens a Facebook search for the name."
      },
      {
        "name": "Raising Kids in Bastrop",
        "href": "https://www.facebook.com/groups/26310813888574424",
        "detail": "Private · about 2,000 members · Bastrop · about 5 posts a day"
      },
      {
        "name": "Homeschooling in Bastrop County, TX",
        "href": "https://www.facebook.com/groups/HomeschoolingInBastropCounty",
        "detail": "Private · about 1,900 members · Bastrop County · about 3 posts a day"
      },
      {
        "name": "Bastrop County Moms",
        "href": "https://www.facebook.com/groups/1539773369607002",
        "detail": "Private · about 1,600 members · Bastrop County · about 6 posts a day"
      },
      {
        "name": "Bastrop Girls Night Out",
        "href": "https://www.facebook.com/groups/1216226932357735",
        "detail": "Private · about 1,500 members · Bastrop"
      },
      {
        "name": "Bastrop Community Senior Center",
        "href": "https://www.facebook.com/groups/863872678221042",
        "detail": "Private · about 1,000 members · Bastrop"
      },
      {
        "name": "Healthy Bastrop Women's Community",
        "href": "https://www.facebook.com/groups/healthybastropmamas",
        "detail": "Public · about 987 members · Bastrop"
      },
      {
        "name": "Bastrop Woman Journal",
        "href": "https://www.facebook.com/groups/bastropwoman",
        "detail": "Private · about 873 members · Bastrop"
      },
      {
        "name": "Bastrop CAN Parent Network",
        "href": "https://www.facebook.com/groups/bastropcan",
        "detail": "Public · about 640 members · Bastrop"
      },
      {
        "name": "Bastrop County TX Kids Activities",
        "href": "https://www.facebook.com/groups/966620728305386",
        "detail": "Public · about 544 members · Bastrop County"
      }
    ]
  },
  {
    "id": "pets",
    "title": "Pets",
    "intro": "Lost pets, rehoming, and animal groups.",
    "items": [
      {
        "name": "Bastrop County Lost & Found Pets",
        "href": "https://www.facebook.com/groups/1536792033282085",
        "detail": "Public · about 19,000 members · Bastrop County"
      },
      {
        "name": "Bastrop TX pet rehoming",
        "href": "https://www.facebook.com/groups/1089338274574619",
        "detail": "Public · about 4,300 members · Bastrop"
      },
      {
        "name": "Bastrop CATS Network - Bastrop County Texas",
        "href": "https://www.facebook.com/groups/184255915069076",
        "detail": "Public · about 3,400 members · Bastrop County"
      },
      {
        "name": "Bastrop DOGS Network",
        "href": "https://www.facebook.com/groups/338319589674475",
        "detail": "Public · about 2,200 members · Bastrop · about 3 posts a day"
      },
      {
        "name": "Bastrop County Lost and Found",
        "href": "https://www.facebook.com/groups/578490938884686",
        "detail": "Public · about 2,000 members · Bastrop County"
      },
      {
        "name": "Bastrop County TX Poultry",
        "href": "https://www.facebook.com/groups/514480513454937",
        "detail": "Public · about 1,400 members · Bastrop County · about 2 posts a day"
      },
      {
        "name": "Bastrop County Beekeepers Association",
        "href": "https://www.facebook.com/groups/481797524085650",
        "detail": "Public · about 905 members · Bastrop County"
      },
      {
        "name": "BCAS Foster and Volunteers Bastrop, TX",
        "href": "https://www.facebook.com/groups/837561623036205",
        "detail": "Private · about 651 members · Bastrop County"
      }
    ]
  },
  {
    "id": "things-to-do",
    "title": "Clubs and things to do",
    "intro": "Markets, outdoors, sports, and hobby clubs.",
    "items": [
      {
        "name": "City of Bastrop Recreation Center",
        "href": "https://www.facebook.com/groups/bastroprecreation",
        "detail": "Public · about 4,000 members · Bastrop"
      },
      {
        "name": "Bastrop 1832 Farmers Market",
        "href": "https://www.facebook.com/groups/Bastrop1832FarmersMarket",
        "detail": "Public · about 3,800 members · Bastrop"
      },
      {
        "name": "Bastrop Area Off-Road and Recovery",
        "href": "https://www.facebook.com/groups/bastropareaoffroadrecovery",
        "detail": "Public · about 3,100 members · Bastrop"
      },
      {
        "name": "Bastrop County Craft Shows & Events",
        "href": "https://www.facebook.com/groups/2002546010088233",
        "detail": "Public · about 1,700 members · Bastrop County · about 9 posts a day"
      },
      {
        "name": "Bastrop Community PLANT EXCHANGE",
        "href": "https://www.facebook.com/groups/3175960352732538",
        "detail": "Public · about 1,600 members · Bastrop"
      },
      {
        "name": "Fishing Lake Bastrop",
        "href": "https://www.facebook.com/groups/fishinglakebastropgroup",
        "detail": "Public · about 1,500 members · Lake Bastrop"
      },
      {
        "name": "Bastrop Area Cruisers",
        "href": "https://www.facebook.com/groups/398024867036356",
        "detail": "Public · about 1,000 members · Bastrop"
      },
      {
        "name": "Crafters of Bastrop Texas",
        "href": "https://www.facebook.com/groups/447179058761500",
        "detail": "Public · about 720 members · Bastrop"
      },
      {
        "name": "Bastrop County Organic Gardeners",
        "href": "https://www.facebook.com/groups/443212390301239",
        "detail": "Public · about 536 members · Bastrop County"
      },
      {
        "name": "Bastrop Vikings Preparedness Network",
        "href": "https://www.facebook.com/groups/362156287658693",
        "detail": "Private · about 526 members · Bastrop · about 3 posts a day"
      },
      {
        "name": "Bastrop Dance",
        "href": "https://www.facebook.com/groups/201204464338624",
        "detail": "Public · about 413 members · Bastrop"
      },
      {
        "name": "FAITH & FAMILY Movies in Bastrop",
        "href": "https://www.facebook.com/groups/264834713701049",
        "detail": "Public · about 342 members · Bastrop"
      },
      {
        "name": "Bastrop County A&M Club",
        "href": "https://www.facebook.com/groups/140590212677474",
        "detail": "Public · about 302 members · Bastrop County"
      },
      {
        "name": "The New Backstage Pass for Bastrop Athletes",
        "href": "https://www.facebook.com/groups/bastropbears",
        "detail": "Public · about 279 members · Bastrop"
      },
      {
        "name": "Bastrop Running Club",
        "href": "https://www.facebook.com/groups/bastroprunningclub",
        "detail": "Public · about 248 members · Bastrop"
      },
      {
        "name": "Bastrop County Amateur Radio Club (BCARC)",
        "href": "https://www.facebook.com/groups/bcarchams",
        "detail": "Public · about 220 members · Bastrop County"
      }
    ]
  },
  {
    "id": "civic",
    "title": "Civic groups",
    "intro": "Watch groups, veterans, and local political clubs. These are not county offices.",
    "items": [
      {
        "name": "Crime Watch Bastrop County, TX",
        "href": "https://www.facebook.com/groups/1105721411203646",
        "detail": "Private · about 826 members · Bastrop County"
      },
      {
        "name": "Bastrop County Veterans Collaborative",
        "href": "https://www.facebook.com/groups/2385284978409161",
        "detail": "Public · about 443 members · Bastrop County"
      },
      {
        "name": "Bastrop County African American Cultural Center",
        "href": "https://www.facebook.com/groups/711136093960387",
        "detail": "Public · about 425 members · Bastrop County"
      },
      {
        "name": "Bastrop County Patriots",
        "href": "https://www.facebook.com/groups/382099969801546",
        "detail": "Public · about 256 members · Bastrop County"
      },
      {
        "name": "Bastrop County Stonewall Democrats",
        "href": "https://www.facebook.com/groups/372195916606431",
        "detail": "Public · about 221 members · Bastrop County"
      },
      {
        "name": "Bastrop Neighborhood Watch",
        "href": "https://www.facebook.com/groups/615734365822335",
        "detail": "Public · about 148 members · Bastrop"
      },
      {
        "name": "Texas House District 17: Bastrop, Burleson, Caldwell...",
        "href": "https://www.facebook.com/groups/1220378016916173",
        "detail": "Public · about 112 members · HD17 · about 2 posts a day"
      },
      {
        "name": "Protect Bastrop County - Data Center Impact",
        "href": "https://www.facebook.com/groups/1351133457189495",
        "detail": "Public · about 101 members · Bastrop County"
      },
      {
        "name": "Bastrop County Young Republicans (Unofficial)",
        "href": "https://www.facebook.com/groups/bastropyr",
        "detail": "Public · about 67 members · Bastrop County"
      },
      {
        "name": "Deflock Bastrop County!",
        "href": "https://www.facebook.com/groups/deflockbastrop",
        "detail": "Public · about 60 members · Bastrop County"
      },
      {
        "name": "Politics affecting Bastrop County...Local, State",
        "href": "https://www.facebook.com/groups/1305647751397102",
        "detail": "Public · about 51 members · Bastrop County"
      }
    ]
  },
  {
    "id": "news-pages",
    "title": "News and guides",
    "intro": "News, weather, and visitor pages to follow.",
    "items": [
      {
        "name": "Discover Bastrop",
        "href": "https://www.facebook.com/DiscoverBastropTX",
        "detail": "Travel Company · about 45,000 followers · Bastrop County"
      },
      {
        "name": "Explore Bastrop County",
        "href": "https://www.facebook.com/ExploreBastropCounty",
        "detail": "Public & Government Service · about 26,000 followers · Bastrop County"
      },
      {
        "name": "The Bastrop Advertiser",
        "href": "https://www.facebook.com/bastropadvertiser",
        "detail": "Newspaper · about 12,000 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Weather",
        "href": "https://www.facebook.com/BastropCountyCommentary",
        "detail": "News & media website · about 5,300 followers · Bastrop County"
      },
      {
        "name": "We Are Okay In Bastrop",
        "href": "https://www.facebook.com/weareokayinbastrop",
        "detail": "Community · about 3,200 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Best",
        "href": "https://www.facebook.com/BastropCountyBestContest",
        "detail": "Advertising/Marketing · about 2,400 followers · Bastrop County"
      },
      {
        "name": "Bastrop Garage Sales",
        "href": "https://www.facebook.com/BastropGarageSales",
        "detail": "Business & Economy Website · about 1,800 followers · Bastrop County"
      },
      {
        "name": "Bastrop Guide",
        "href": "https://www.facebook.com/bastropguide",
        "detail": "Entertainment website · about 1,100 followers · Bastrop County"
      },
      {
        "name": "Building Bastrop County",
        "href": "https://www.facebook.com/BuildBastropCounty",
        "detail": "Local & travel website · about 154 followers · Bastrop County"
      }
    ]
  },
  {
    "id": "official",
    "title": "City, county, and schools",
    "intro": "Facebook pages for local government, schools, and emergency services. For an emergency, call 911.",
    "items": [
      {
        "name": "Bastrop County Emergency Services District 2",
        "href": "https://www.facebook.com/BastropESD2",
        "detail": "Government Organization · about 15,000 followers · Bastrop County"
      },
      {
        "name": "Bastrop County First Responders",
        "href": "https://www.facebook.com/BastropCountyFirstResponders",
        "detail": "Emergency Rescue Service · about 4,900 followers · Bastrop County"
      },
      {
        "name": "Bastrop ISD Community Relations",
        "href": "https://www.facebook.com/BastropISDCommunityRelations",
        "detail": "Education · about 2,000 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Animal Services",
        "href": "https://www.facebook.com/bastropcountyanimalcontrolandshelter",
        "detail": "Animal Shelter · Bastrop County"
      },
      {
        "name": "Bastrop County Elections",
        "href": "https://www.facebook.com/BastropCountyElections",
        "detail": "Government Organization · Bastrop County"
      },
      {
        "name": "Bastrop County ESD No. 1",
        "href": "https://www.facebook.com/bastropesd1",
        "detail": "Fire Protection · Bastrop County"
      },
      {
        "name": "Bastrop County Office of Emergency Management",
        "href": "https://www.facebook.com/BastropCountyOEM",
        "detail": "Government Organization · Bastrop County"
      },
      {
        "name": "Bastrop County WCID #2",
        "href": "https://www.facebook.com/BCWCID2",
        "detail": "Public Utility · Bastrop County"
      },
      {
        "name": "Bastrop Economic Development Corporation",
        "href": "https://www.facebook.com/BastropTXEDC",
        "detail": "Government Organization · Bastrop County"
      },
      {
        "name": "Bastrop ISD",
        "href": "https://www.facebook.com/bastropisdtx",
        "detail": "Public School · Bastrop County"
      },
      {
        "name": "Bastrop Police Department",
        "href": "https://www.facebook.com/bastroppd",
        "detail": "Police Station · Bastrop County"
      },
      {
        "name": "Bastrop Public Library",
        "href": "https://www.facebook.com/BastropPublicLibrary",
        "detail": "Library · Bastrop County"
      },
      {
        "name": "Bastrop/Travis ESD1",
        "href": "https://www.facebook.com/nbcfrtx",
        "detail": "Government Organization · Bastrop County"
      },
      {
        "name": "City of Bastrop TX - City Government",
        "href": "https://www.facebook.com/bastroptx",
        "detail": "City Hall · Bastrop County"
      },
      {
        "name": "City of Bastrop, TX Parks & Recreation",
        "href": "https://www.facebook.com/parksandrecbastroptx",
        "detail": "Government Service · Bastrop County"
      }
    ]
  },
  {
    "id": "parties",
    "title": "Parties and campaigns",
    "intro": "Party and candidate pages.",
    "items": [
      {
        "name": "Bastrop County Conservatives",
        "href": "https://www.facebook.com/BastropCountyConservatives",
        "detail": "Political Organization (PAC) · about 960 followers · Bastrop County"
      },
      {
        "name": "Dock Jackson for Bastrop",
        "href": "https://www.facebook.com/DockJacksonTx",
        "detail": "Political Candidate · about 663 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Young Republicans",
        "href": "https://www.facebook.com/BastropYR",
        "detail": "Political Organization · about 652 followers · Bastrop County"
      },
      {
        "name": "Bastrop County GOP Club",
        "href": "https://www.facebook.com/BastropGOPClub",
        "detail": "Political Organization · about 221 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Democratic Party",
        "href": "https://www.facebook.com/BastropDems",
        "detail": "Political Party · Bastrop County"
      },
      {
        "name": "Bastrop County Republican Party",
        "href": "https://www.facebook.com/BCRPBastropTX",
        "detail": "Political Organization · Bastrop County"
      }
    ]
  },
  {
    "id": "nonprofits",
    "title": "Nonprofits",
    "intro": "Food, recovery, youth sports, and local clubs.",
    "items": [
      {
        "name": "Bastrop Lost and Found Pets",
        "href": "https://www.facebook.com/BastropLostAndFoundPets",
        "detail": "Interest · about 8,900 followers · Bastrop County"
      },
      {
        "name": "Bastrop Youth Baseball & Softball",
        "href": "https://www.facebook.com/PlayBallBastrop",
        "detail": "Local Business · about 3,400 followers · Bastrop County"
      },
      {
        "name": "Bastrop Cats Anonymous TNR Society",
        "href": "https://www.facebook.com/bastropcats",
        "detail": "Charity · about 3,300 followers · Bastrop County"
      },
      {
        "name": "Bastrop PRIDE",
        "href": "https://www.facebook.com/BASTROP.TX.PRIDE",
        "detail": "Community · about 2,000 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Gem and Mineral Society",
        "href": "https://www.facebook.com/bastropcountygemandmineralsociety",
        "detail": "Community Organization · about 1,500 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Aggie Moms' Club",
        "href": "https://www.facebook.com/bastropcountyaggiemoms",
        "detail": "Community Organization · about 1,400 followers · Bastrop County"
      },
      {
        "name": "Bastrop Education Foundation Sportsmen's",
        "href": "https://www.facebook.com/BastropSportsmens",
        "detail": "Nonprofit · about 1,000 followers · Bastrop County"
      },
      {
        "name": "The MomCo at River Valley Bastrop",
        "href": "https://www.facebook.com/MomCoRiverValleyBastrop",
        "detail": "Community Organization · about 1,000 followers · Bastrop County"
      },
      {
        "name": "Bastrop County Historical Commission",
        "href": "https://www.facebook.com/bastropcountyhistoricalcommissiontexas",
        "detail": "Community · about 562 followers · Bastrop County"
      },
      {
        "name": "Bastrop County AgriLife Extension/4-H",
        "href": "https://www.facebook.com/BastropCounty4H",
        "detail": "Nonprofit · Bastrop County"
      },
      {
        "name": "Bastrop County Cares",
        "href": "https://www.facebook.com/BastropCares",
        "detail": "Nonprofit · Bastrop County"
      },
      {
        "name": "Bastrop County Emergency Food Pantry",
        "href": "https://www.facebook.com/BastropCountyFoodPantry",
        "detail": "Nonprofit · Bastrop County"
      },
      {
        "name": "Bastrop County Long Term Recovery Team",
        "href": "https://www.facebook.com/bcltrt",
        "detail": "Nonprofit · Bastrop County"
      },
      {
        "name": "Bastrop County Master Gardeners",
        "href": "https://www.facebook.com/BastropCountyMasterGardeners",
        "detail": "Community Service · Bastrop County"
      },
      {
        "name": "Bastrop Regional Chamber of Commerce",
        "href": "https://www.facebook.com/BastropChamber",
        "detail": "Nonprofit · Bastrop County"
      },
      {
        "name": "Children's Advocacy Center (Bastrop, Lee, Fayette)",
        "href": "https://www.facebook.com/CACBastropLeeFayette",
        "detail": "Nonprofit · Bastrop County"
      }
    ]
  },
  {
    "id": "places",
    "title": "Places to go",
    "intro": "Parks, markets, and places people visit.",
    "items": [
      {
        "name": "Dinosaur Park - Bastrop, Texas",
        "href": "https://www.facebook.com/TheDinoPark",
        "detail": "Attraction · about 43,000 followers · Bastrop County"
      },
      {
        "name": "The Colony of Bastrop",
        "href": "https://www.facebook.com/TheColonyBastrop",
        "detail": "Real Estate (community) · about 2,900 followers · Bastrop County"
      },
      {
        "name": "Main Event Bastrop TX Art",
        "href": "https://www.facebook.com/MainEventBastropArt",
        "detail": "Venue · about 2,400 followers · Bastrop County"
      },
      {
        "name": "Bastrop 1832 Farmers Market",
        "href": "https://www.facebook.com/Bastrop1832farmersmarket",
        "detail": "Farmers Market · Bastrop County"
      },
      {
        "name": "Bastrop Convention & Exhibit Center",
        "href": "https://www.facebook.com/BastropConventionCenter",
        "detail": "Venue · Bastrop County"
      },
      {
        "name": "Bastrop River Company",
        "href": "https://www.facebook.com/BastropRiverCompany",
        "detail": "Rafting/Kayaking · Bastrop County"
      }
    ]
  }
];
