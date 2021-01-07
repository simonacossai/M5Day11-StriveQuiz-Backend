const express = require("express")
const listEndpoints = require("express-list-endpoints")
const questionsRouter = require("./questions")
var cors = require('cors')
const {badRequestHandler,notFoundHandler,genericErrorHandler} = require("./errorHandlers")

const server = express()
server.use(cors())

const port = process.env.PORT || 3001

server.use(express.json())
server.use("/exams", questionsRouter)

server.use(badRequestHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server))

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})