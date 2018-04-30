import {BigNumber} from "bignumber.js"

declare module "aws-lambda" {
  interface Context {
    functionName: string
    functionVersion: string
    invokedFunctionArn: string
  }

  interface EntryPoint {
    (event: any, context: Context, callback: Callback): any
  }
}

interface Env {
  influxUser: string
  influxPass: string
  influxHost: string
}

interface ElbLogParserObject {
  timestamp: string
  elb: string
  client: string
  client_port: string
  target: string
  request_processing_time: string
  target_processing_time: string
  response_processing_time: string
  elb_status_code: string
  target_status_code: string
  received_bytes: string
  sent_bytes: string
  request: string
  user_agent: string
  ssl_cipher: string
  ssl_protocol: string
  target_port: string
  request_method: string
  request_uri: string
  request_http_version: string
  request_uri_scheme: string
  request_uri_host: string
  request_uri_port: string
  request_uri_path: string
  request_uri_query: string
}

export interface InfluxPoint extends Array<any>{0:any}

export interface InfluxElbPoint extends Array<Point>{0:Point}

export interface Point {
  measurement?: string
  tags: InfluxElbTags
  fields: InfluxElbValues
  timestamp: any
}

export interface InfluxElbValues {
  request_processing_time: number
  backend_processing_time: number
  response_processing_time: number
  total_processing_time: number
  received_bytes: number
  sent_bytes: number
  total_bytes: number
  request_uri_path: string
}

export interface InfluxElbTags { 
  application: string
  environment: string
  elb_status_code: string
  backend_status_code: string
}