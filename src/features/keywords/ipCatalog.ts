import type { IpCategory } from "./ip";

/**
 * Names that are well known to be someone else's IP on Etsy — characters,
 * celebrities, brands, franchises. Checked instantly, before any online
 * lookup, and the only source for names Wikipedia cannot settle alone (a
 * "Stitch" page lists a dozen meanings).
 */
export type CatalogEntry = {
  names: string[];
  category: IpCategory;
  owner: string;
  /** "possible" for names that are usually, but not always, the IP. */
  level: "yes" | "possible";
  /**
   * For words with an everyday meaning: YES with one of `requires` in the
   * keyword, NO inside one of the `generic` phrases, POSSIBLE otherwise.
   */
  context?: { requires: string[]; generic?: string[] };
};

const list = (names: string) =>
  names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

const yes = (category: IpCategory, owner: string, names: string): CatalogEntry => ({
  names: list(names),
  category,
  owner,
  level: "yes",
});

const maybe = (category: IpCategory, owner: string, names: string): CatalogEntry => ({
  names: list(names),
  category,
  owner,
  level: "possible",
});

const ambiguous = (
  category: IpCategory,
  owner: string,
  names: string,
  requires: string,
  generic = "",
): CatalogEntry => ({
  names: list(names),
  category,
  owner,
  level: "possible",
  context: { requires: list(requires), generic: list(generic) },
});

export const IP_CATALOG: CatalogEntry[] = [
  // Characters
  yes("CHARACTER", "Disney", "mickey mouse, minnie mouse, donald duck, daisy duck, lilo and stitch, lilo & stitch, lilo stitch, experiment 626, winnie the pooh, pooh bear, tigger, eeyore, buzz lightyear, lightning mcqueen, simba, baymax, maleficent, cruella de vil, tinkerbell, tinker bell, jack skellington, oogie boogie, sanderson sisters, winifred sanderson, mirabel madrigal, bruno madrigal, mike wazowski, sulley, olaf frozen, elsa and anna, anna and elsa"),
  yes("CHARACTER", "Lucasfilm", "baby yoda, grogu, darth vader, yoda, chewbacca, mandalorian, stormtrooper, r2d2, r2 d2, bb8"),
  yes("CHARACTER", "Marvel", "spider man, spiderman, spidey, iron man, ironman, captain america, hulk, deadpool, groot, thanos, avengers, black widow, scarlet witch, wakanda"),
  yes("CHARACTER", "DC", "batman, superman, wonder woman, harley quinn, aquaman, catwoman, gotham city"),
  yes("CHARACTER", "Nintendo", "super mario, mario bros, mario kart, luigi, princess peach, bowser, yoshi, donkey kong, legend of zelda, princess zelda, triforce, animal crossing, splatoon"),
  yes("CHARACTER", "The Pokémon Company", "pokemon, pokeball, pikachu, charizard, eevee, gengar, jigglypuff, snorlax, bulbasaur, squirtle, charmander, mewtwo"),
  yes("CHARACTER", "Sega", "sonic the hedgehog"),
  yes("CHARACTER", "Sanrio", "sanrio, hello kitty, kuromi, my melody, cinnamoroll, pompompurin, pochacco, keroppi, badtz maru"),
  yes("CHARACTER", "Peanuts Worldwide", "snoopy, charlie brown, peanuts gang"),
  yes("CHARACTER", "Dr. Seuss Enterprises", "grinch, grinchmas, cat in the hat, thing 1, thing 2, thing one, thing two, lorax, dr seuss, whoville, cindy lou who"),
  yes("CHARACTER", "Ludo Studio / BBC", "bluey, bingo heeler, bandit heeler, chilli heeler, bluey heeler"),
  yes("CHARACTER", "Various owners", "garfield, spongebob, squarepants, squidward, patrick star, peppa pig, paw patrol, cocomelon, ms rachel, blippi, elmo, cookie monster, big bird, oscar the grouch, sesame street, care bears, grumpy bear, my little pony, shrek, minions, despicable me, scooby doo, tom and jerry, bugs bunny, looney tunes, tweety bird, pink panther, betty boop, popeye, smurfs, ninja turtles, tmnt, pac man, among us, wednesday addams, addams family, beetlejuice, freddy krueger, jason voorhees, chucky, pennywise, ghostface, squishmallow, squishmallows, pusheen, gudetama, rilakkuma, totoro, studio ghibli, spirited away, howls moving castle, kikis delivery service, naruto, goku, dragon ball, one piece, luffy, demon slayer, nezuko, tanjiro, jujutsu kaisen, sailor moon, attack on titan, chainsaw man, minecraft, roblox, fortnite, five nights at freddys, fnaf, huggy wuggy, poppy playtime, hello neighbor"),

  // Franchises and entertainment
  yes("FRANCHISE", "Warner Bros.", "harry potter, hogwarts, gryffindor, slytherin, hufflepuff, ravenclaw, hermione, dumbledore, deathly hallows, platform 9 3 4, wizarding world, fantastic beasts"),
  yes("FRANCHISE", "Disney", "toy story, encanto, lion king, nightmare before christmas, zootopia, inside out 2, monsters inc, finding nemo, lilo, moana 2, frozen 2, descendants disney, disney princess, pixar"),
  yes("CHARACTER", "Pop Mart", "labubu, pop mart"),
  yes("FRANCHISE", "Sony Pictures Animation / Netflix", "kpop demon hunters, k pop demon hunters, huntrix, huntr x, huntrx, saja boys"),
  yes("CELEBRITY", "Salman Khan", "salman khan"),
  yes("CELEBRITY", "Shah Rukh Khan", "shah rukh khan, srk"),
  yes("BRAND", "Nike, Inc.", "nike, just do it, air jordan, jumpman"),
  yes("FRANCHISE", "Various owners", "star wars, jurassic park, jurassic world, lord of the rings, frodo, gandalf, game of thrones, house of the dragon, hunger games, stranger things, hellfire club, squid game, gilmore girls, greys anatomy, schitts creek, ted lasso, dunder mifflin, dwight schrute, central perk, beth dutton, rip wheeler, dutton ranch, breaking bad, the walking dead, star trek, doctor who, ghostbusters, back to the future, top gun, twilight saga, barbie, hot wheels, transformers, power rangers"),
  yes("OTHER_IP", "Sports leagues and events", "nfl, nba, mlb, nhl, ncaa, wnba, mls, wwe, ufc, nascar, formula 1, formula one, super bowl, march madness, olympics, olympic games, fifa, fifa world cup, stanley cup final"),
  ambiguous("FRANCHISE", "Disney", "stitch", "lilo, disney, ohana, 626, angel, experiment", "cross stitch, stitch marker, stitch markers, crochet stitch, crochet stitches, knit stitch, knitting stitch, embroidery stitch, stitch guide, stitch sampler, moss stitch, waffle stitch, bobble stitch, puff stitch, shell stitch, seed stitch, stitch pattern, stitch patterns, stitch counter, blanket stitch, running stitch, back stitch, chain stitch, stitches"),
  ambiguous("FRANCHISE", "Disney", "frozen, moana, coco, tangled, cars, inside out, aladdin, mulan, pocahontas, little mermaid, beauty and the beast, cinderella, snow white, rapunzel, peter pan, sleeping beauty", "disney, princess, elsa, anna, olaf, maui, pua, heihei, lightning, mcqueen, genie, jasmine, ariel, sebastian, belle, gaston, tinkerbell, hook, pixar", "frozen food, frozen meal, frozen yogurt, coco chanel, cocoa, hot cars, classic cars, race cars, toy cars"),
  ambiguous("CHARACTER", "Disney", "elsa, olaf, ariel, belle, jasmine, ursula, maui", "frozen, disney, princess, mermaid, beast, aladdin, moana"),
  ambiguous("CHARACTER", "Nintendo / Sega", "zelda, kirby, sonic, mario", "nintendo, hyrule, link, triforce, hedgehog, tails, knuckles, luigi, bros, kart, switch, video game, gamer, gaming"),
  ambiguous("CHARACTER", "Marvel / DC", "thor, loki, wolverine, venom, joker, black panther, flash", "marvel, avengers, asgard, mjolnir, superhero, comic, dc, gotham, batman"),
  ambiguous("FRANCHISE", "Various owners", "friends, the office, yellowstone, wednesday, hocus pocus, twilight", "tv show, sitcom, central perk, dunder, mifflin, dwight, dutton, rip wheeler, addams, nevermore, sanderson, bella, edward, cullen", "friends forever, best friends, girl friends, twilight sky, national park"),
  ambiguous("OTHER_IP", "FIFA", "world cup", "fifa, soccer, football, messi, ronaldo"),
  maybe("BRAND", "Cricut", "cricut, cricut maker, cricut joy"),
  maybe("BRAND", "Silhouette / Canva", "silhouette cameo, canva"),

  // Celebrities
  yes("CELEBRITY", "Taylor Swift", "taylor swift, swiftie, swifties, eras tour, taylors version"),
  yes("CELEBRITY", "Various people", "travis kelce, jason kelce, beyonce, rihanna, harry styles, bad bunny, morgan wallen, zach bryan, luke combs, dolly parton, elvis presley, johnny cash, bob ross, sabrina carpenter, chappell roan, olivia rodrigo, billie eilish, ariana grande, selena gomez, justin bieber, kanye west, kim kardashian, lady gaga, shakira, snoop dogg, eminem, tupac, michael jackson, freddie mercury, kurt cobain, bts, blackpink, stray kids, jungkook, jimin, taehyung, salman khan, shah rukh khan, srk, amitabh bachchan, deepika padukone, alia bhatt, ranbir kapoor, ranveer singh, katrina kaif, priyanka chopra, virat kohli, ms dhoni, sachin tendulkar, lionel messi, messi, cristiano ronaldo, neymar, lebron james, michael jordan, kobe bryant, stephen curry, caitlin clark, tom brady, patrick mahomes, mahomes, simone biles, serena williams, tiger woods, oprah, donald trump, trump 2024, trump 2028, barack obama, kamala harris, joe biden, elon musk, mrbeast, mr beast, marilyn monroe, audrey hepburn, frida kahlo, bob marley, jimi hendrix, john lennon, the beatles, beatles, rolling stones, grateful dead, metallica, ac dc, acdc, guns n roses, pink floyd, led zeppelin, fleetwood mac, one direction, jonas brothers, post malone, kacey musgraves, lainey wilson, jelly roll, chris stapleton, george strait, garth brooks, reba mcentire, shania twain, stevie nicks"),
  ambiguous("CELEBRITY", "Various people", "elvis, prince, drake, madonna, kelce, ronaldo, nirvana, queen", "presley, singer, rapper, band, concert, tour, fan, kurt, freddie, mercury, chiefs, football, soccer, cr7"),

  // Brands
  yes("BRAND", "Disney", "disney, disneyland, disney world, walt disney, magic kingdom, epcot, disney cruise, mickey ears, marvel studios, lucasfilm"),
  yes("BRAND", "Various companies", "nike, just do it, air jordan, jumpman, adidas, under armour, new balance, crocs, birkenstock, lululemon, gucci, louis vuitton, chanel, prada, dior, versace, fendi, burberry, balenciaga, michael kors, kate spade, tory burch, hydro flask, owala, starbucks, dunkin, dunkin donuts, coca cola, pepsi, mcdonalds, taco bell, chick fil a, buc ees, bucees, trader joes, costco, walmart, apple watch, airpods, iphone, macbook, ipad, nintendo, playstation, xbox, sega, pop mart, lego, mattel, hasbro, nerf, play doh, crayola, polly pocket, cabbage patch, beanie babies, build a bear, harley davidson, john deere, chevrolet, ferrari, porsche, lamborghini, tiktok, instagram, youtube, netflix, spotify, carhartt, the north face, north face, ralph lauren, tommy hilfiger, calvin klein, levis, bape, dr pepper, red bull, monster energy, jack daniels, jim beam, crown royal, bud light, budweiser, coors light, white claw, titos, hennessy, jose cuervo, jagermeister, tupperware, pyrex, le creuset, kitchenaid, lilly pulitzer, vera bradley, hershey, hersheys, m&ms, skittles, oreo, cheetos, doritos, nutella, pringles, sonic drive in"),
  ambiguous("BRAND", "Various companies", "stanley, yeti, coach, jordan, puma, converse, vans, jeep, tesla, patagonia, supreme, champion, corona, apple, target, amazon", "tumbler, quencher, cup, 40 oz, 40oz, rambler, cooler, bag, purse, handbag, wallet, tabby, shoes, sneakers, sneaker, logo, jacket, fleece, beer, iphone, airpods, watch band, store, prime, run"),

  // Sports teams
  yes("BRAND", "NFL teams", "dallas cowboys, kansas city chiefs, green bay packers, philadelphia eagles, pittsburgh steelers, steelers, packers, 49ers, las vegas raiders, raiders, seahawks, detroit lions, chicago bears, buffalo bills, miami dolphins, denver broncos, new england patriots, baltimore ravens, cincinnati bengals, tampa bay buccaneers, new york giants, new york jets, los angeles rams, minnesota vikings, atlanta falcons, new orleans saints, houston texans, tennessee titans, indianapolis colts, jacksonville jaguars, cleveland browns, arizona cardinals, carolina panthers, washington commanders, los angeles chargers, go birds, chiefs kingdom, who dey"),
  yes("BRAND", "NBA, MLB and NHL teams", "los angeles lakers, lakers, boston celtics, celtics, chicago bulls, golden state warriors, san antonio spurs, miami heat, new york knicks, knicks, new york yankees, yankees, dodgers, red sox, houston astros, astros, chicago cubs, atlanta braves, toronto maple leafs, maple leafs, vegas golden knights"),
  yes("BRAND", "College and club teams", "roll tide, crimson tide, georgia bulldogs, ohio state buckeyes, buckeyes, michigan wolverines, texas longhorns, hook em, lsu tigers, notre dame, fighting irish, clemson tigers, ole miss, florida gators, real madrid, fc barcelona, manchester united, man united, liverpool fc, chelsea fc, inter miami, arsenal fc"),
  ambiguous("BRAND", "Sports teams", "spurs, chiefs, cowboys, eagles, bengals, ravens, cubs, braves, gators, bulldogs, tigers, wolverines, longhorns, warriors, heat, cardinals, packers, broncos, patriots, giants, jets, rams, saints, titans, colts, jaguars, panthers, falcons, vikings", "nfl, nba, mlb, football, basketball, baseball, game day, gameday, team, fan, fans, kansas city, dallas, philadelphia, san antonio, chicago, atlanta, georgia, florida, detroit, cincinnati, baltimore, texas, touchdown, tailgate, super bowl", "cowboy boots, cowboy hat, western spurs, boot spurs, space cowboy, rodeo cowboys, eagle feather, bald eagle, tiger lily, rams horn, saints day, all saints"),
];
