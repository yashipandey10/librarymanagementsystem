let books = JSON.parse(localStorage.getItem("books")) || [];
localStorage.setItem("books", JSON.stringify(books));
let a = 0;

function generateId(obj) {
  const { title, genre } = obj;
  const id = title[0] + (title[1] || 0) + genre[0] + (genre[1] || 0) ;
  return id.toString();
}

function displayTable() {
  let arr = JSON.parse(localStorage.getItem("books"));
  let tbl = document.getElementById("tbl-shw");
  tbl.innerHTML = `<tr>
            <th>Title</th>
            <th>Image</th>
            <th>Genre</th>
            <th>Action</th>
        </tr>`;
  arr.forEach((row) => {
    let tr = document.createElement("tr");
    const { title, image, genre, id } = row;
    tr.innerHTML = `<td>${title}</td><td><img style="height:5rem" src =${image}></img></td><td>${genre}</td><td><button>edit</button> <button onclick="deletebook('${id}')">delete</button></td>`;
    tbl.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  displayTable();
});

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
  bookcard();
}
