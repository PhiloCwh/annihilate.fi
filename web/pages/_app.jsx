/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2023-12-24 05:11:34
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-24 21:54:00
 * @FilePath: /TheLastOneGame/pages/_app.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import "../styles/globals.css"
import Nav from '@/components/Nav';
import { Web3Provider } from "providers/Web3"
import { Toaster } from 'react-hot-toast'
import Head from 'next/head';
import { Watermark } from 'antd';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <Web3Provider>

        <Nav />
        <Component {...pageProps} />
        <Toaster position="top-center"></Toaster>
      </Web3Provider>
    </>
  )
}

export default MyApp
