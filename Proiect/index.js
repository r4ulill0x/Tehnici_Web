const express= require("express");
const path= require("path");
const fs=require("fs");
const sharp= require("sharp");
const sass = require('sass');
const pg=require("pg")

const Client=pg.Client;

client= new Client({
  database:"examen2",
  user:"sas",
  password:"sas",
  host:"localhost",
  port:"5432"
})

client.connect()
client.query("select * from carti", function(err, rezRandare){
  console.log(err)
  console.log(rezRandare)
})



app= express();

app.set("view engine", "ejs");

console.log("Folder index.js", __dirname);
console.log("Folder curent", process.cwd());
console.log("Cale fisier", __filename);

obGlobal ={
    obErori: null,
    obImagini: null,
    folderScss:path.join(__dirname,"resurse/scss"),
    folderCss:path.join(__dirname,"resurse/css"),
    folderBackup:path.join(__dirname, "backup"),
    optiuniMeniu:[]
}

vectorFoldere=["temp","poze_uploadate", "backup", "temp1"]
for (let folder of vectorFoldere){
  let folderAbsolutPath=path.join(__dirname,folder)
  if (!fs.existsSync(folderAbsolutPath))
    fs.mkdirSync(folderAbsolutPath)
}

app.get("/favicon.ico", function(req, res){
  res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
})

app.get("/galerie", function(req, res) {
  res.render("pagini/galerie", { imagini: obGlobal.obImagini.imagini });
});



// Cerinta 2
app.get("/static/*", function(req, res) {
  const fisierCale = path.join(__dirname, "resurse", req.url.substring("/static".length));
  if (fs.existsSync(fisierCale)) {
    res.sendFile(fisierCale);
  } else {
    afisareEroare(res, 404, "Fișier inexistent", "Fișierul cerut nu a fost găsit.");
  }
});




app.get(["/","/index","/home"], function(req,res){
    console.log(req.params)
    res.render("pagini/index", {ip: req.ip, imagini:obGlobal.obImagini.imagini});
})

app.get("*.ejs", function(req, res){
  afisareEroare(res, 400);
})

// Cerinta 1

app.get(/^\/resurse\/[a-z0-9A-Z\/]*\/$/, function(req, res){
  afisareEroare(res, 403);
}) 



// send file automat
app.use("/resurse", express.static(path.join(__dirname,"resurse")));


app.get("/produse",function(req, res){
    console.log("===")
    console.log(req.query)
    var conditieQuery="";
    if(req.query.tip){
      conditieQuery=` where tip_produs='${req.query.tip}'`
    }
  client.query("select * from unnest(enum_range(null::categ_prajitura))", function (err, rezOptiuni){
    console.log(rezOptiuni)
    client.query(`select * from prajituri ${conditieQuery}`, function(err, rez){
      if (err){
        console.log(err);
        afisareEroare(res, 2);
      }
      else {
        res.render("pagini/produse", {produse: rez.rows, optiuni:rezOptiuni.rows});
      }
    })
  });
})

app.get("/produs/:id", function(req, res){
  client.query(`select * from prajituri where id=${req.params.id}`, function(err, rez){
    if (err){
      console.log(err);
      afisareEroare(res, 2);
    }
    else {
      res.render("pagini/produs", {prod: rez.rows[0]});
    }
  })
})



app.get('/carti', async (req, res) => {
  try {
      // Citim parametrii din query string
      let anMinim = parseInt(req.query.an_minim) || 0;  // Dacă an_minim nu este specificat, se va folosi 0
      let anMaxim = parseInt(req.query.an_maxim) || 9999;  // Dacă an_maxim nu este specificat, se va folosi 9999

      // Construim query-ul SQL pentru a selecta cărțile între anMinim și anMaxim
      const query = 'SELECT * FROM carti WHERE an_publicare BETWEEN $1 AND $2';
      const { rows } = await client.query(query, [anMinim, anMaxim]);

      console.log(`Cărți între ${anMinim} și ${anMaxim}:`, rows);  // Debugging - vezi cărțile returnate

      // Randăm pagina EJS cu cărțile filtrate
      res.render('carti', { carti: rows });

  } catch (err) {
      console.error('Eroare interogare:', err);  // Afișăm eroarea în caz că interogarea nu reușește
      res.status(500).send('Eroare la preluarea cărților');
  }
});







app.get("/*", function(req, res){
    console.log(req.url)
    try {
      res.render("pagini"+req.url, function(err, rezRandare){
        console.log("Eroare", err);
        console.log("Rezultat Randare", rezRandare);
        if (err){
          // res.render("pagini/eroare");
          if (err.message.startsWith("Failed to lookup view")){
            afisareEroare(res, 404, "Pagina negasita", "Verificati URL-ul");
          }
          else {
            afisareEroare(res, -1);
          }
        }
        else {
          res.send(rezRandare);
        }
      })
    }
    catch (err1){
      if (err1.message.startsWith("Cannot find module")){
        afisareEroare(res, 404, "Pagina negasita", "Verificati URL-ul");
      }
      else {
        afisareEroare(res, -1);
      }
    }
})


//    app.get("/ceva", function(req, res){
//        res.send("test")
//     })


function initErori(){
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    obGlobal.obErori=JSON.parse(continut)
    console.log(obGlobal.obErori)
    obGlobal.obErori.eroare_default.imagine=path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine)
    for (let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
    console.log(obGlobal.obErori);
}

initErori()


function afisareEroare(res, identificator, titlu, text, imagine){
  let eroare= obGlobal.obErori.info_erori.find(function(elem){
                return elem.identificator==identificator
              });
  if(eroare){
    if (eroare.status)
      res.status(identificator)
    var titluCustom=titlu || eroare.titlu;
    var textCustom=text || eroare.text;
    var imagineCustom=imagine || eroare.imagine;
  }
  else {
    var err= obGlobal.obErori.eroare_default
    var titluCustom=titlu || err.titlu;
    var textCustom=text || err.text;
    var imagineCustom=imagine || err.imagine;
  }
  res.render("pagini/eroare", { //trasnmit obiectul locals
    titlu: titluCustom,
    text: textCustom,
    imagine: imagineCustom
})
}

function initImagini(){
  var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

  obGlobal.obImagini=JSON.parse(continut);
  let vImagini=obGlobal.obImagini.imagini;

  let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
  let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
  if (!fs.existsSync(caleAbsMediu))
      fs.mkdirSync(caleAbsMediu);

  //for (let i=0; i< vErori.length; i++ )
  for (let imag of vImagini){
      [numeFis, ext]=imag.fisier_imagine.split(".");
      let caleFisAbs=path.join(caleAbs,imag.fisier_imagine);
      let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
      sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
      imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
      imag.fisier_imagine=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier_imagine )
      
  }
  console.log(obGlobal.obImagini)
}


initImagini();

function compileazaScss(caleScss, caleCss) {
  if(!caleCss){
      let numeFisExt = path.basename(caleScss);
      let numeFis = numeFisExt.split(".")[0];
      caleCss = numeFis+".css";
  }
  
  if (!path.isAbsolute(caleScss))
      caleScss = path.join(obGlobal.folderScss, caleScss);
  if (!path.isAbsolute(caleCss))
      caleCss = path.join(obGlobal.folderCss, caleCss);
  
  let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
  if (!fs.existsSync(caleBackup)) {
      fs.mkdirSync(caleBackup,{recursive:true});
  }
  
  // la acest punct avem cai absolute in caleScss si caleCss
  let numeFisCss = path.basename(caleCss);
  if (fs.existsSync(caleCss)){
      let timestamp = Date.now();
      let numeFisCssBackup = numeFisCss.replace(".css", `_${timestamp}.css`);
      fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css", numeFisCssBackup));
  }
  rez = sass.compile(caleScss, {"sourceMap":true});
  fs.writeFileSync(caleCss,rez.css);
}

vFisiere = fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
  if (path.extname(numeFis) == ".scss"){
      compileazaScss(numeFis);
  }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis) {
  if (eveniment == "change" || eveniment == "rename"){
      let caleCompleta = path.join(obGlobal.folderScss, numeFis);
      if (fs.existsSync(caleCompleta)){
          compileazaScss(caleCompleta);
      }
  }
})

app.listen(8080);