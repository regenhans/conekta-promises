const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config()

// CONEKTA.IO STUFF
var conekta = require('conekta')
conekta.api_key = process.env.CONEKTA_PRIVATE_KEY
conekta.api_version = '2.0.0'
conekta.locale = 'es'

// support parsing of application/json type post data
app.use(bodyParser.json())

// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }))

// Set pug as view engine
app.set('view engine', 'pug')
app.set('views', './views')
app.use(express.static('dist'))

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/charge', (req, res) => {
  let response = res
  let tokenId = req.body.conektaTokenId
  let customerName = req.body.nombre
  let customerEmail = req.body.email

  createCustomer(customerName, customerEmail, tokenId)
    .then(function (user) {
      chargeUser(user)
        .then(function (data) {
          response.send(data.id)
        })
    })
})

// IMPLEMENTAR PROMISES

const createCustomer = function (name, email, token) {
  return new Promise((resolve, reject) => {
    conekta.Customer.create({
      'name': name,
      'email': email,
      'payment_sources': [{
        'type': 'card',
        'token_id': token
      }]
    }, function (err, res) {
      if (err) {
        reject(Error(err))
      } else {
        resolve(res.toObject())
      }
    })
  })
}

const chargeUser = function (userId) {
  return new Promise((resolve, reject) => {
    conekta.Order.create(
      {
        'line_items': [{
          'name': 'Your item',
          'unit_price': 10000,
          'quantity': 1
        }],
        'currency': 'USD',
        'customer_info': {
          'customer_id': userId.id
        },
        'metadata': { 'description': 'Item desc' },
        'charges': [{
          'payment_method': {
            'type': 'default'
          }
        }]
      },
      function (err, res) {
        if (err) {
          reject(Error(err))
        } else {
          resolve(res.toObject())
        }
      })
  })
}

app.listen(8080)
