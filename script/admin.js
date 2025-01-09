document.addEventListener("DOMContentLoaded", () => {
  displayTable();
});

let books = JSON.parse(localStorage.getItem("books")) || [];
let a = 0;

function generateId(obj) {
  const { title, genre } = obj;
  const id = title[0] + (title[1] || 0) + genre[0] + (genre[1] || 0);
  return id.toString();
}

function displayTable() {
  let arr = JSON.parse(localStorage.getItem("books"));
  let tbl = document.getElementById("tbl-shw");
  tbl.innerHTML = `<tr border="1">
            <th>Title</th>
            <th>Image</th>
            <th>Genre</th>
            <th>Action</th>
        </tr>`;
  arr.forEach((row) => {
    let tr = document.createElement("tr");
    const { title, image, genre, id } = row;
    tr.innerHTML = `<td>${title}</td><td><img style="height:5rem" src ='${image}'></img></td><td>${genre}</td><td><button style="border-radius:15px ;border: 1px solid black; background-color: #A8D8B9;color: #2f4858;" onclick="editBook('${id}')">edit</button> <button style="border-radius:15px;border: 1px solid black; background-color: red ;color: white;" onclick="deletebook('${id}')">delete</button></td>`;
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
  let booklist = JSON.parse(localStorage.getItem("books"));
  booklist = booklist.filter((book) => book.id !== id);
  localStorage.setItem("books", JSON.stringify(booklist));
  displayTable();
}

function editBook(bookId) {
  const booklist = JSON.parse(localStorage.getItem("books"));
  const book = booklist.find((book) => book.id === bookId);
  if (book) {
    document.getElementById("edit-book-id").value = book.id;
    document.getElementById("edit-title").value = book.title;
    document.getElementById("edit-genre").value = book.genre;
    document.getElementById("edit-image").value = "";
    document.getElementById("edit-modal").style.display = "block";
  }
}

function saveEdit() {
  const bookId = document.getElementById("edit-book-id").value;
  const title = document.getElementById("edit-title").value;
  const genre = document.getElementById("edit-genre").value;

  const imageInput = document.getElementById("edit-image");
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
    const booklist = JSON.parse(localStorage.getItem("books"));
    const currentBook = booklist.find((book) => book.id === bookId);
    image = currentBook.image; 
    updateBook(bookId, title, genre, image);
  }
}

function closeEditForm() {
  document.getElementById("edit-modal").style.display = "none";
}

function updateBook(bookId, title, genre, image) {
  const booklist = JSON.parse(localStorage.getItem("books"));
  const bookIndex = booklist.findIndex((book) => book.id === bookId);

  if (bookIndex !== -1) {
    const currentBook = booklist[bookIndex];
    booklist[bookIndex] = {
      id: bookId,
      title: title || currentBook.title,
      genre: genre || currentBook.genre,
      image: image || currentBook.image,
    };

    localStorage.setItem("books", JSON.stringify(booklist));
    displayTable();
    closeEditForm();
  }
}

document
  .getElementById("edit-book-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const bookId = document.getElementById("edit-book-id").value;
    const title = document.getElementById("edit-title").value;
    const genre = document.getElementById("edit-genre").value;
    const imageInput = document.getElementById("edit-image-input");
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
