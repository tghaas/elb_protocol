//"use strict"
import * as path from "path"
import * as readline from "readline"
import * as YAML from "js-yaml"
import * as zlib from "zlib"
import * as fs from "fs"
import { ElbLogParserObject } from "./types"
import { BigNumber } from "bignumber.js"
import * as Bluebird from 'bluebird'
import AsyncLineReader from "./async_line_reader"
import { None } from "./async_line_reader"
import * as recursive from "recursive-readdir"


let parse = require("elbv2-log-parser")
let execSync = require('child_process').execSync

const testFolder = '/tmp/logs/';


main()

async function main() {
  try {
    recursive(testFolder, async (err, files) => {
      let tot_lines = 0
      let tot_v1 = 0
      let tot_v11 = 0
      let tot_v12 = 0

      for (var index in files) {
        let lineCount = await readLines(files[index])
        tot_lines = tot_lines + lineCount[0]
        tot_v1 = tot_v1 + lineCount[1]
        tot_v11 = tot_v11 + lineCount[2]
        tot_v12 = tot_v12 + lineCount[3]
        console.log(`Processed  ${tot_lines} log lines from ${tot_v1}  ${tot_v11}  ${tot_v12}`)
      }
      console.log(`Processed  ${tot_lines} log lines from ${tot_v1}  ${tot_v11}  ${tot_v12}`)
      let v1_p = (tot_v1 / tot_lines) * 100
      let v11_p = (tot_v11 / tot_lines) * 100
      let v12_p = (tot_v12 / tot_lines) * 100
      console.log(`Totals: TLS_v1: ${v1_p}% TLS_v1.1: ${v11_p}% TLS_V1.2: ${v12_p}%`)
    })

  } catch (e) {
    console.log(e.stack)
    process.exit(1)
  }
}

async function readLines(filename: any): Promise<number[]> {
  let logFile = fs.createReadStream(filename)
  let asyncLineReader = new AsyncLineReader({ input: logFile.pipe(zlib.createGunzip()) })
  let lines = 0
  let tls1 = 0
  let tls11 = 0
  let tls12 = 0
  let ssl_protocols = []

  let line: (string | None) = ""
  while (true) {
    line = await asyncLineReader.getLine()
    if (typeof (line) == 'string') {
      try {
        let point = parseLine(<string>line)
        if (point === null) { continue }
        switch (point) {
          case "TLSv1":
            tls1++
            break
          case "TLSv1.1":
            tls11++
            break
          case "TLSv1.2":
            tls12++
        }
        lines++
      } catch (e) {
        logFile.close()
        throw e
      }
    } else {
      break
    }
  }
  ssl_protocols = [lines, tls1, tls11, tls12]
  return ssl_protocols
}

function parseLine(line: string) {
  let originalLine = line
  try {
    let obj: ElbLogParserObject = parse(line)
    return mapParsedEntryToInflux(obj)
  } catch (e) {
    console.log("Error parsing line: ", originalLine)
    return null
  }
}


function mapParsedEntryToInflux(parsedEntry: ElbLogParserObject) {
  return parsedEntry.ssl_protocol
}
