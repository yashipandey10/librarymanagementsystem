let borrowedBook = localStorage.getItem('CurrborrowedId');

(document.getElementById("bookdone")).innerHTML = borrowedBook;
let borrowbtn = document.getElementsByClassName('btn-brw')[0];
borrowbtn.innerText = "Return Book";
borrowbtn.onclick = function() {
    localStorage.removeItem('CurrborrowedId');
    alert("Book Returned Successfully");
    window.location.href="index.html";
}