
/*
*1=>2=>4=>3
* Promise 构造函数是同步执行的，promise.then 中的函数是异步执行的
*/
const promise = new Promise((resolve,reject)=>{
    console.log(1);
    resolve();
    console.log(2);
});
promise.then(()=>{
    console.log(3);
});
console.log(4);

/*
*promise1 Promise { <pending> }
* promise2 Promise { <pending> }
*(node:10440) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: error
* promise1 Promise { 'success' }
* promise2 Promise {
* <rejected> Error: error
  * at promise1.then (E:\devilCode\promise\detect.js:31:11) }
*
*promise 有 3 种状态：pending、fulfilled 或 rejected。
* 状态改变只能是 pending->fulfilled 或者 pending->rejected，状态一旦改变则不能再变。
* promise2 并不是 promise1，而是返回的一个新的 Promise 实例
 */

const promise1 = new Promise((resolve,reject)=>{
    setTimeout(()=>{
        resolve('success');
    },1000)
});
const promise2 = promise1.then(()=>{
    throw new Error('error');
});
console.log('promise1',promise1);
console.log('promise2',promise2);
setTimeout(()=>{
    console.log('promise1',promise1);
    console.log('promise2',promise2);
},2000);

/*
*then: success1
*
* 构造函数中的 resolve 或 reject 只有第一次执行有效，多次调用没有任何作用
* promise 状态一旦改变则不能再变
 */

const threePromise = new Promise((resolve,reject)=>{
    resolve('success1');
    reject('error');
    resolve('success2');
});

threePromise.then((res)=>{
    console.log('then:',res);
}).catch((err)=>{
    console.log('catch',err);
});

/*
* 1
* 2
*
* promise 可以链式调用。
* promise 每次调用 .then 或者 .catch 都会返回一个新的 promise，从而实现了链式调用
 */

Promise.resolve(1).then((res)=>{
    console.log(res);
    return 2;
}).catch((err)=>{
    return 3;
}).then((res)=>{
    console.log(res);
});

/*
* once
* success 1000
* success 1000
*
* promise 的 .then 或者 .catch 可以被调用多次
* 但这里 Promise 构造函数只执行一次。
* 或者说 promise 内部状态一经改变，并且有了一个值，那么后续每次调用 .then 或者 .catch 都会直接拿到该值
 */

const fivePromise = new Promise((resolve,reject)=>{
    setTimeout(()=>{
        console.log('once');
        resolve('success');
    },1000);
});

const start = Date.now();
fivePromise.then((res)=>{
    console.log(res,Date.now()-start);
});

fivePromise.then((res)=>{
    console.log(res,Date.now()-start);
});


/*
*then: Error: error
    at Promise.resolve.then (E:\devilCode\promise\detect.js:121:12)
    at process._tickCallback (internal/process/next_tick.js:109:7)
    at Module.runMain (module.js:606:11)
    at run (bootstrap_node.js:389:7)
    at startup (bootstrap_node.js:149:9)
    at bootstrap_node.js:504:3

*
*
*.then 或者 .catch 中 return 一个 error 对象并不会抛出错误，所以不会被后续的 .catch 捕获
*
 */

Promise.resolve().then(()=>{
    return new Error('error');
})
    .then((res)=>{
    console.log('then:',res);
    })
.catch((err)=>{
    console.log('catch:',err);
});

/*
*TypeError: Chaining cycle detected for promise #<Promise>
    at resolvePromise (native)
    at process._tickCallback (internal/process/next_tick.js:109:7)
    at Module.runMain (module.js:606:11)
    at run (bootstrap_node.js:389:7)
    at startup (bootstrap_node.js:149:9)
    at bootstrap_node.js:504:3

*
*.then 或 .catch 返回的值不能是 promise 本身，否则会造成死循环
 */

const sevenPromise = Promise.resolve()
.then(()=>{
    return sevenPromise;
});
sevenPromise.catch(console.error);

/*
* 1
*
* .then 或者 .catch 的参数期望是函数，传入非函数则会发生值穿透
 */
Promise.resolve(1).then(2).then(Promise.resolve(3)).then(console.log);

/*
*fail2 Error: error
    at success (E:\devilCode\promise\detect.js:172:11)
    at process._tickCallback (internal/process/next_tick.js:109:7)
    at Module.runMain (module.js:606:11)
    at run (bootstrap_node.js:389:7)
    at startup (bootstrap_node.js:149:9)
    at bootstrap_node.js:504:3
*
*then 可以接收两个参数，第一个是处理成功的函数，第二个是处理错误的函数
* .catch 是 .then 第二个参数的简便写法
* 但是它们用法上有一点需要注意：.then 的第二个处理错误的函数捕获不了第一个处理成功的函数抛出的错误，而后续的 .catch 可以捕获之前的错误
*
 */
Promise.resolve().then(function success(res){
    throw new Error('error');
},function fail(e) {
    console.error('fail1: ', e);
}).catch(function fail2(e) {
console.error('fail2',e);
});

/*
*end
*nextTick
*then
*setImmediate
*
*process.nextTick 和 promise.then 都属于 microtask
* 而 setImmediate 属于 macrotask
* 在事件循环的 check 阶段执行
* 事件循环的每个阶段（macrotask）之间都会执行 microtask，事件循环的开始会先执行一次 microtask
*
 */

process.nextTick(()=>{
    console.log('nextTick');
});
Promise.resolve().then(()=>{
    console.log('then');
});

setImmediate(()=>{
    console.log('setImmediate');
});
console.log('end');