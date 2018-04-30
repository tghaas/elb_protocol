let proxyquire = require("proxyquire")

localMain()
async function localMain() {
    let main = require("./index").main
    main()
}
