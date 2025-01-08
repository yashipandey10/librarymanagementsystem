document.addEventListener("DOMContentLoaded", () => {
  displayTable();
});

let books = JSON.parse(localStorage.getItem("books")||[]);
let a = 0;

function generateId(obj) {
  const { title, genre } = obj;
  const id = title[0] + (title[1] || 0) + genre[0] + (genre[1] || 0) ;
  return id.toString();
}

function displayTable() {
  let arr = JSON.parse(localStorage.getItem("books"));
  let tbl = document.getElementById("tbl-shw");

  tbl.innerHTML = `<div class="tablepu"><tr>
            <th>Title</th>
            <th>Image</th>
            <th>Genre</th>
            <th>Action</th>
        </tr></div>`;
  arr.forEach((row) => {
    let tr = document.createElement("tr");
    const { title, image, genre, id } = row;
    tr.innerHTML = `<td>${title}</td><td><img style="height:5rem" src =${image}></img></td><td>${genre}</td><td><button onclick="editBook('${id}')">edit</button> <button onclick="deletebook('${id}')">delete</button></td>`;
    tbl.appendChild(tr);
  });
}

function add() {
  const title = document.getElementById("title-input").value;
  const genre = document.getElementById("genre-input").value;
  const imageInput = document.getElementById("image-input");
  const imageFile = imageInput.files[0];

  if (title && genre && imageFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const imageSrc = event.target.result;
      const newBook = {
        id: generateId({ title, genre }),
        title: title,
        image: imageSrc,
        genre: genre,
      };
      books.push(newBook);
      localStorage.setItem("books", JSON.stringify(books));
      document.getElementById("title-input").value = "";
      document.getElementById("genre-input").value = "";
      imageInput.value = "";
      displayTable();
    };
    reader.readAsDataURL(imageFile);
  } else {
    alert("Please fill in all fields.");
  }
}

function deletebook(id) {
  let booklist = JSON.parse(localStorage.getItem("books")) || [];
  booklist = booklist.filter((book) => book.id !== id);
  localStorage.setItem("books", JSON.stringify(booklist));
  displayTable();
}

function editBook(bookId) {
  const booklist = JSON.parse(localStorage.getItem("books"));
  const book = booklist.find((book) => book.id === bookId);
  if(book){
    document.getElementById("title-input").value = book.title;
    document.getElementById("genre-input").value = book.genre;
    // document.getElementById("image-input").value = book.image;
    document.getElementById("edit-id").value = generateId(book.id);
  }
}

document.getElementById("edit-book-form").addEventListener("submit", function (event) {
  // event.preventDefault();
  const bookId = document.getElementById("edit-book-id").value;
  const title = document.getElementById("edit-title").value;
  const genre = document.getElementById("edit-genre").value;
  
  const imageInput = document.getElementById("image-input");
  const imageFile = imageInput.files[0];
  let image = "";
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      image = event.target.result;
      updateBook(bookId, title, genre, image);
    };
    reader.readAsDataURL(imageFile); 
  } else {
    const currentBook = books.find((book) => book.id === bookId);
    image = currentBook.image; 
    updateBook(bookId, title, genre, image);
  }
});

  const booklist = JSON.parse(localStorage.getItem("books"));
  const bookIndex = booklist.findIndex(book => book.id === bookId);
  if (bookIndex !== -1) {
    booklist[bookIndex] = {
      id: bookId,
      title: title,
      genre: genre,
      image: image
    };
    localStorage.setItem("books", JSON.stringify(booklist));
    document.getElementById("books").innerHTML = "";
    bookcard();
    closeEditForm();
  }
});

function closeEditForm() {
  document.getElementById("edit-form").style.display = "none";
}
