/**
 * 原始回调方法
 */
setTimeout(function () {
    let a = 100;
    console.log(a);
    setTimeout(function () {
        let b = 200;
        console.log(b);
        setTimeout(function () {
            let c = 300;
            console.log(c)
        }, 1000);
    }, 1000);
}, 1000);

/**
 * Promise实现
 */
new Promise(function (resolve, reject) {
    setTimeout(function () {
        let a = 100;
        resolve(a);
    }, 1000);
}).then(function (res) {
    console.log(res);

    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            let b = 200;
            resolve(b);
        }, 1000);
    });

}).then(function (res) {
    console.log(res);

    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            let c = 300;
            resolve(c);
        }, 1000);
    });
}).then(function (res) {
    console.log(res);
});


/**
 * 题目:红灯三秒亮一次，绿灯一秒亮一次，黄灯2秒亮一次；如何让三个灯不断交替重复亮灯？
 * (用Promse实现)
 */

function redLight() {
    console.log('stop');
}

function greenLight() {
    console.log('walk');
}

function yellowRight() {
    console.log('wait');
}

let tic = function (timer, cb) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            cb();
            resolve();
        }, timer)
    });
};
//一个周期

let d = new Promise(function (resolve, reject) {
    resolve();
});

let step = function (def) {
    def.then(function () {
        return tic(3000, redLight);
    }).then(function () {
        return tic(2000, greenLight);
    }).then(function () {
        return tic(1000, yellowRight);
    })
};

step(d);

/**
 * node -v7 支持async
 */
// async function loop(){
//     return new Promise(function(resolve, reject){
//         (async function(){
//             await tic(redLight, 3000);
//             await tic(greenLight, 2000);
//             await tic(yellowRight, 1000);
//             await loop();
//         })();
//     })
// }
// loop();　　　

/**
 * Promise的理解
 *
 * 买菜：shop
 * 做饭: cook
 * 送饭:delivery
 * 通知: notice
 */


function shop(resolve, reject) {
    setTimeout(function () {
        resolve(['西红柿', '鸡蛋', '油菜']);
    }, 3000)
}

function cook(resolve, reject) {
    setTimeout(function () {
        //对做好的饭进行下一步处理。
        return ({
            food: '米饭',
            dish: ['西红柿炒鸡蛋', '清炒油菜']
        })
    }, 3000)
}

function delivery(resolve, reject) {
    //对送饭的结果进行下一步处理
    resolve('么么哒');
}

function notice() {
    //电话通知我后的下一步处理
    console.log('给保姆加100块钱奖金');
}

/**
 * Promise版本
 */

/**
 *  告诉保姆帮我做几件连贯的事情，先去超市买菜=>shop
 */
new Promise(买菜)
/**
 * 用买好的菜做饭=>shop-result
 */
    .then((买好的菜) => {
        return new Promise(做饭);
    })
    /**
     *把做好的饭送到老婆公司
     */
    .then((做好的饭) => {
        return new Promise(送饭);
    })
    /**
     *送完饭后打电话通知我
     */
    .then((送饭结果) => {
        电话通知我();
    });

/**
 * Promise 的升级
 * ES6 出现了 generator 以及 async/await 语法，使异步处理更加接近同步代码写法，可读性更好
 * 同时异常捕获和同步代码的书写趋于一致
 */
(async () => {
    let 蔬菜 = await 买菜();
    let 饭菜 = await 做饭(蔬菜);
    let 送饭结果 = await 送饭(饭菜);
    let 通知结果 = await 通知我(送饭结果);
})();