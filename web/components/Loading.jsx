/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-23 10:21:36
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-01-23 10:23:53
 * @FilePath: /Xpet/components/loading.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import styles from '@/assets/styles/Loading.module.css'; // 引入样式文件

const Loading = () => {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
        </div>
    );
};

export default Loading;
