var express = require('express')
var bodyParser = require('body-parser')
var app = express() //reference variable
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

var dbUrl = 'mongodb://localhost:27017/belajar_nodejs'
var Message = mongoose.model('Message', {nama: String, pesan: String}) //schema definition
var Badword = mongoose.model('Badword', {word: String});
app.get('/pesan', function (req, res) {
    Message.find({}, function (err, pesan) {
        res.send(pesan)
    })
});

app.post('/pesan', async function (req, res) {
    let splitted_message = req.body.pesan.split(" ");
    let badword = [];
    await Badword.find({}, (err, word) => {
        word.forEach(element => {
            badword.push(element.word);
        });
    });

    splitted_message.forEach((element, idx) => {
        if(badword.includes(element)){
            splitted_message[idx] = element.replace(element.substring(1,element.length-1), "*".repeat(element.length-2));
        }
    });
    req.body.pesan = splitted_message.join(" ");
    var message = new Message(req.body);
    message.save(function (err) {
        if (err) {
            sendStatus(500)
        }
        Message.findOne({pesan:'badword'}, (err, sensor) => {
            if (sensor) {
                console.log('kata badword telah ditemukan', sensor)
                Message.deleteMany({_id: sensor.id}, (err) => {
                    console.log('kata badword telah disensor!')
                })
            }
        })
        io.emit('pesan', req.body)
        res.sendStatus(200)
    })
});

io.on('connection', function (socket) {
    console.log('a user connected')
})

mongoose.connect(dbUrl, function (err) {
    console.log('koneksi ke mongodb berhasil', err)
})

var server = http.listen(3000, function () {
    console.log("port server adalah", server.address().port)
})