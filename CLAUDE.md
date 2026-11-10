# Knitting Pattern Helper – ohjeet Claude Codelle

## Mikä tämä on
Neulekaavioiden seuranta- ja (tulevaisuudessa) suunnittelutyökalu. Tekijä Minna Purkunen on kokenut neuloja, joten neulontaan liittyvät tiedot tulevat häneltä. Kysy, jos neulontakäytäntö on epäselvä, äläkä arvaa.

## Tekninen rakenne
Kaksi välilehteä: **Neulo** (valmiin kaavion seuranta) ja **Suunnittele** (laskin ja kaavioeditori).

```
index.html          HTML-rakenne (ei tyylejä eikä skriptejä)
css/styles.css      kaikki tyylit
js/i18n.js          I18N-sanakirja (FI + EN), t(), kielivalinta
js/tracker.js       Neulo: lataus, rajaus, seuranta, näppäinkomennot
js/tracker-session.js  Neulo: muisti (kuva, rajaus, nykyinen kerros) IndexedDB:ssä
js/calculator.js    Suunnittele: älykäs laskin
js/editor.js        Suunnittele: kaavioeditori (canvas, värit, maalaus, täyttö, kumoa)
js/chart-file.js    kaavion automaattinen tallennus selaimeen, vienti/tuonti (.json) ja PNG
js/app.js           välilehdet ja käynnistys (ladataan viimeisenä)
```

- Vanilla JS tavallisina `<script>`-tiedostoina (ei moduuleja, ei frameworkeja, ei build-vaihetta). Tiedostot jakavat globaalit muuttujat, joten latausjärjestys `index.html`:ssä on tärkeä.
- Uusi iso osa saa oman tiedostonsa `js/`-kansioon.
- Editorin data: `editor.cells[kerros * silmukat + silmukka]`, jossa silmukka 0 on **oikeanpuoleisin** ja kerros 0 **alin**. Piirrettäessä koordinaatit käännetään.
- Kaaviotiedoston muoto on kuvattu `js/chart-file.js`:n alussa. Jos muoto muuttuu, nosta `version`-numeroa ja pidä vanhojen tiedostojen avaus toimivana.
- Julkaisu: Netlify julkaisee `main`-haaran automaattisesti, ja jokaisesta PR:stä tulee Deploy Preview.

## Neulontakäytännöt (tärkeät)
- Kaaviota luetaan oletuksena **alhaalta ylös** ja **oikealta vasemmalle**. Numerointi noudattaa samaa.
- Kaavioissa on yleensä kaksi väriä: pohjaväri ja kontrastiväri.
- Neuletiheys ilmoitetaan muodossa silmukkaa / 10 cm ja kerrosta / 10 cm.
- Kirjoneule ja palmikot joustavat vähemmän kuin sileä neulos.

## Työtapa
- Jokainen muutos tehdään omassa haarassa (`feature/...` tai `fix/...`) ja yhdistetään pull requestin kautta.
- Yksi ominaisuus kerrallaan. Viittaa issueen commit-viestissä (esim. `Closes #1`).
- Ennen kuin ilmoitat valmiiksi: testaa, että seuranta-tila toimii yhä (kuvan lataus → rajaus → neulominen).
- Tarkista myös, ettei sivulle synny vaakavieritystä (puhelin ~375 px ja leveä näyttö), ja että molemmat kielet toimivat.
- Uudet tekstit lisätään `I18N`-sanakirjaan molemmille kielille, ei suoraan HTML:ään.
- Käyttöliittymä on kaksikielinen (FI / EN). Suomenkielinen termistö: *kerros* (ei rivi), *suljettuna / tasona*, *kuviokerta*.
