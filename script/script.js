const booksloaded = [
  {
    "genre": "Action & Adventure",
    "id": "atse0",
    "image": "images/where_the_sun_never_set.jpg",
    "title": "where the sun never set"
  },
  {
    "genre": "self-help",
    "id": "atse1",
    "image": "images/The_Power_of_Now.jpg",
    "title": "The Power of Now"
  },
  {
    "genre": "self-help",
    "id": "atse2",
    "image": "images/The_7_Habits_of_Highly_Effective_People.jpg",
    "title": "The 7 Habits of Highly Effective People"
  },
  {
    "genre": "self-help",
    "id": "atse3",
    "image": "images/How_to_Win_Friends_and_Influence_People.jpg",
    "title": "How to Win Friends and Influence People"
  },
  {
    "genre": "self-help",
    "id": "atse4",
    "image": "images/Think_and_Grow_Rich.jpg",
    "title": "Think and Grow Rich"
  },
  {
    "genre": "self-help",
    "id": "atse5",
    "image": "images/The_Subtle_Art_of_Not_Giving_a_Fuck.jpg",
    "title": "The Subtle Art of Not Giving a F*ck"
  },
  {
    "genre": "self-help",
    "id": "atse6",
    "image": "images/Deep_Work.jpg",
    "title": "Deep Work"
  },
  {
    "genre": "self-help",
    "id": "atse7",
    "image": "images/Can_t_Hurt_Me.jpg",
    "title": "Can't Hurt Me"
  },
  {
    "genre": "self-help",
    "id": "atse8",
    "image": "images/Man_s_Search_for_Meaning.jpg",
    "title": "Man's Search for Meaning"
  },
  {
    "genre": "self-help",
    "id": "atse9",
    "image": "images/Mindset_The_New_Psychology_of_Success.jpg",
    "title": "Mindset: The New Psychology of Success"
  },
  {
    "genre": "self-help",
    "id": "atse10",
    "image": "images/The_Four_Agreements.jpg",
    "title": "The Four Agreements"
  },
  {
    "genre": "self-help",
    "id": "atse11",
    "image": "images/Grit_The_Power_of_Passion_and_Perseverance.jpg",
    "title": "Grit: The Power of Passion and Perseverance"
  }
];
document.addEventListener("DOMContentLoaded", ()=>{
  bookcard();
  if (!localStorage.getItem("books")) {
  localStorage.setItem("books", JSON.stringify(booksloaded))
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
  let genre =[]
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
    bookcard.innerHTML = `<img class="book-img" src="${book.image}"><h4>${book.title}</h4><h3>${book.genre}</h3><button class="btn-brw" id="${book.id}">borrow</button>`;
    bookContainer.appendChild(bookcard);
   }
  });
  
}