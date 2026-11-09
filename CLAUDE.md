# Knitting Pattern Helper – ohjeet Claude Codelle

## Mikä tämä on
Neulekaavioiden seuranta- ja (tulevaisuudessa) suunnittelutyökalu. Tekijä Minna Purkunen on kokenut neuloja, joten neulontaan liittyvät tiedot tulevat häneltä. Kysy, jos neulontakäytäntö on epäselvä, äläkä arvaa.

## Tekninen rakenne
- Yksi tiedosto: `index.html` (HTML + CSS + vanilla JS). Ei frameworkeja, ei build-vaihetta.
- Julkaisu: Netlify.
- Pidä rakenne yksinkertaisena. Jos tiedosto kasvaa liian suureksi, ehdota jakoa ennen kuin teet sen.

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
- Käyttöliittymän kieli: suomi (nykyinen UI on englanniksi, käännös on backlogissa).
