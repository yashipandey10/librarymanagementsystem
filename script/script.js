const booksloaded = [
  {
    "genre": "Action & Adventure",
    "id": "atse0",
    "image": "book images/wherethesunneverset.jpg",
    "title": "where the sun never set"
  },
  {
    "genre": "Biography",
    "id": "atse1",
    "image": "book images/dreamfrommyfatherbio.jpg",
    "title": "Dream from my father"
  },
  {
    "genre": "Mystery",
    "id": "atse2",
    "image": "book images/murderatbreakersmsty.jpeg",
    "title": "Murder at breakers"
  },
  {
    "genre": "Horror",
    "id": "atse3",
    "image": "book images/gravehorror.jpeg",
    "title": "Grave secrets"
  },
  {
    "genre": "Thriller & Suspense",
    "id": "atse4",
    "image": "book images/desentthrill.jpg",
    "title": "Desent"
  },
  {
    "genre": "Historical Fiction",
    "id": "atse5",
    "image": "book images/lostnamehisandfic.jpeg",
    "title": "Book of lost names"
  },
  {
    "genre": "Romance",
    "id": "atse6",
    "image": "book images/destinybychance.jpeg",
    "title": "Destiny by chance"
  },
  {
    "genre": "self-help",
    "id": "atse7",
    "image": "book images/youcanwin.jpg",
    "title": "You can win"
  },
  {
    "genre": "folktales",
    "id": "atse8",
    "image": "book images/thethreetreesfolk.jpg",
    "title": "The three tree"
  },
  {
    "genre": "History",
    "id": "atse9",
    "image": "book images/theindus.webp",
    "title":"The indus"
  },
  {
    "genre": "True Crime",
    "id": "atse10",
    "image": "book images/catchandkilled.jpeg",
    "title": "Catch and Killed"
  },
  {
    "genre": "Religious & Spirituality",
    "id": "atse11",
    "image": "book images/shunya.jpg",
    "title": "Shunya"
  },
];

document.addEventListener("DOMContentLoaded", ()=>{
  bookcard();
  if (!localStorage.getItem("books")) {
  localStorage.setItem("books", JSON.stringify(booksloaded));
}
});

function bookcard() {
  let bookContainer = document.getElementById("books");
  const booklist = JSON.parse(localStorage.getItem("books"))|| [];
  console.log(booklist)
  booklist.forEach((book) => {
    let i =String(book.id)
    let bookcard = document.createElement("div");
    bookcard.className = "bookcard";
    bookcard.id = book.id;
    bookcard.innerHTML = `<img class="book-img" src="${book.image}"><h4>${book.title}</h4><h3>${book.genre}</h3><button class="btn-brw" onclick="borrow(${i})" >borrow</button>`;
    bookContainer.appendChild(bookcard);
  });
}

var borrowedTotal = [];
function borrow(id){
  window.location.href = "/borrow.html"
  console.log(id);
  borrowedTotal.push(id.id);
  let idelement = id.innerHTML;  
  localStorage.setItem("CurrborrowedId", idelement);
}

function sidebar(n){
 let p= "btn"+`${n}`
 let genre = document.getElementById(`${p}`).value;
 dis(genre)
 console.log(genre)
}


function dis(g){
  let bookContainer = document.getElementById("books");
  const booklist = JSON.parse(localStorage.getItem("books"))|| [];
  console.log(booklist)
  bookContainer.innerHTML=""
  booklist.forEach((book) => {
   if(book.genre == g)
   {
    let bookcard = document.createElement("div");
    bookcard.className = "bookcard";
    bookcard.id = book.id;
    bookcard.innerHTML = `<img class="book-img" src="${book.image}"><h4>${book.title}</h4><h3>${book.genre}</h3><button class="btn-brw" onclick="borrow(${book.id})">borrow</button>`;
    bookContainer.appendChild(bookcard);
   }
  });
  
}