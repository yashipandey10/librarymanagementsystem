document.addEventListener("DOMContentLoaded", bookcard());

function bookcard() {
  let bookContainer = document.getElementById("books");
  const booklist = JSON.parse(localStorage.getItem("books"))|| [];
  booklist.forEach((book) => {
    let bookcard = document.createElement("div");
    bookcard.className = "bookcard";
    bookcard.id = book.id;
    bookcard.innerHTML = `<img class="book-img" src="${book.image}"><h4>${book.title}</h4><h3>${book.genre}</h3><button class="btn-brw" id=${book.id} >borrow</button>`;
    bookContainer.appendChild(bookcard);
  });
}

