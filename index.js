require("dotenv").config();

// Frame Work
const express = require("express");
const mongoose = require("mongoose");

// Database
const database = require("./database/index");

// Models
const BookModel = require("./database/book");
const AuthorModel = require("./database/author");
const PublicationModel = require("./database/publication");

// Microservices Routes
const Books = require("./API/Book");

// Initializing express
const shapeAI = express();

// Configurations
shapeAI.use(express.json());

// Establish Database Connection
mongoose.connect(process.env.MONGO_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    })
.then(() => console.log("connection established!!!!!!!"));


// Initializing Microservices
shapeAI.use("/book", Books);



/*
Route               /author
Description         get all authors
Access              PUBLIC
Parameters          NONE
Method              GET
*/
shapeAI.get("/author", async (req, res) => {
    const getAllAuthors = await AuthorModel.find();
    return res.json({ authors: getAllAuthors });
});

/*
Route               /author
Description         get a list of authors based on book's isbn
Access              PUBLIC
Parameters          isbn
Method              GET
*/
shapeAI.get("/author/:isbn", (req,res) => {
    const getSpecificAuthors = database.authors.filter((author) =>
    author.books.includes(req.params.isbn)
    );

    if(getSpecificAuthors.length ===0) {
        return res.json({
            error: `No author found for the book ${req.params.isbn}`
        });
    }
    return res.json({ authors: getSpecificAuthors});
});

/*
Route               /publications
Description         get all publications
Access              PUBLIC
Parameters          NONE
Method              GET
*/
shapeAI.get("/publications", async (req, res) => {
    const getAllPublications = await PublicationModel.find();
    return res.json({ publications: getAllPublications });
});



/*
Route               /author/new
Description         add new author
Access              PUBLIC
Parameters          NONE
Method              POST
*/
shapeAI.post("/author/new", (req, res) => {
    const { newAuthor }  = req.body;
    
    AuthorModel.create(newAuthor);

    return res.json({message: "author was added!" });
});

/*
Route               /publication/new
Description         add new publication
Access              PUBLIC
Parameters          NONE
Method              POST
*/
shapeAI.post("/publication/new", (req, res) => {
    const { newPublication }  = req.body;
    database.publications.push(newPublication);
    return res.json({ publications: database.publications, message: "publication was added!" });
});



/*
Route               /publication/update/book
Description         update/add new book to a publication
Access              PUBLIC
Parameters          isbn
Method              PUT
*/
shapeAI.put("/publication/update/book/:isbn", (req, res) => {
    // update the publication database 
    database.publications.forEach((publication) => {
        if(publication.id === req.body.pubId) {
           return publication.books.push(req.params.isbn);
        }
    });

    // update the book database
    database.books.forEach((book) => {
        if(book.ISBN === req.params.isbn) {
            book.publication = req.body.pubId;
            return;
        }
    });
    return res.json({
        books: database.books,
        publications: database.publications,
        message: "Successfully updated publication",
    });
});



/*
Route               /publication/delete/book
Description         delete a book from publication
Access              PUBLIC
Parameters          isbn, publication id
Method              DELETE
*/
shapeAI.delete("/publication/delete/book/:isbn/:pubId", (req,res) => {
    // update publication database 
    database.publications.forEach((publication) => {
        if (publication.id === parseInt(req.params.pubId)) {
            const newBooksList = publication.books.filter(
                (book) => book !== req.params.isbn
                );

                publication.books = newBooksList;
                return;
        }
    });

    // update book database 
    database.books.forEach((book) => {
        if (book.ISBN === req.params.isbn) {
            book.publication = 0;   // no publication available
            return;
        }
    });

    return res.json({ 
        books: database.books, 
        publications: database.publication,
    });
});

shapeAI.listen(3000, () => console.log("Server Running!!😎 "));
