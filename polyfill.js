
/**
 * 定义MyPromise的三种状态常量
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * 判断是某个变量否为function
 * @param variable 需要判断的变量
 */
const isFunction = variable =>{
    return typeof variable === 'function';
};

/**
 * 定义then方法回调函数
 * @param self promise实例
 * @param value 内部的值
 * @param status 所要改变的状态
 */

const callback = (self,value,status)=>{
    /**
     * 状态一旦改变，就不会再变
     */
    if(self._status!==PENDING){
        return;
    }
    self._status = status;

    /**
     * 回调函数
     */
    let handle = res=>{
        self._value = res;

        /**
         * 依次调用then的回调函数
         */

        let cb;

        while (cb=status===PENDING?self._fulfilledQueues.shift():self._rejectedQueues.shift()){
            cb(res);
        }

        self._fulfilledQueues = self._rejectedQueues = self._status = self._value = self._resolve = self._reject = undefined;
    };

    if (value instanceof MyPromise) {
        /**
         * 如果回调函数的参数是一个promise对象，必须等该promise状态改变后在执行当前回调
         */
        value.then(handle, handle)
    } else {
        handle(value)
    }
};

/**
 * 定义MyPromise类
 */
class MyPromise{
    constructor(handle){
        if(!isFunction(handle)){
            throw new Error('MyPromise resolver undefined is not a function');
        }

        /**
         * 存储了then的成功回调函数和失败回调函数的队列, 确保多个then方法的回调函数都能正确执行
         */

        this._fulfilledQueues = [];
        this._rejectedQueues = [];

        /**
         * 初始化promise内部状态和值
         */

        this._status = PENDING;
        this._value = null;
        /**
         * 调用回调函数
         */
        try{
            handle(this._resolve.bind(this),this._reject.bind(this))
        }catch(err) {
            this._reject(err);
        }
    }

    /**
     * 异步执行回调函数，确保then方法先执行（防止resolve在then执行前先执行）
     */
    _resolve(value){
        setTimeout(callback.bind(null,this,value,FULFILLED));
    }
    _reject(value){
        setTimeout(callback.bind(null,this,value,REJECTED))
    }

    /**
     * 为实例添加then方法
     * @param {Function} onFulfilled resolved状态的回调函数
     * @param {Function} onRejected rejected状态的回调函数
     *
     */
    then(onFulfilled,onRejected){
        /**
         * 支持链式调用，返回一个promsie对象
         */

        let promise = new MyPromise((resolveNext,rejectNext)=>{
            let rejected = value=>{
                try {
                    /**
                     * 如果then方法没有指定错误回调，就将错误传递到下一个promise，并reject（直到指定错误回调或catch）
                     * 如果指定了错误回调并且错误回调没有抛出错误，就resolve新的MyPromise
                     */
                    !isFunction(onRejected)?rejectNext(value):resolveNext(onRejected(value));
                }catch (err){
                    /**
                     * 如果then方法的回调抛出错误，就将错误传递到下一个promise，并reject
                     */
                    rejectNext(err);
                }
            };

            let fulfilled = value=>{
                try {
                    /**
                     * res为上一步回调函数的返回结果
                     */
                    let res = value;
                    isFunction(onFulfilled)&&(res = onFulfilled(value));
                    /**
                     * 判断回调的返回值类型
                     * 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
                     * 否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
                     */
                    (res instanceof MyPromise)?res.then(resolveNext,rejectNext):resolveNext(res);
                }catch (err){
                    rejectNext(err);
                }
            };

            switch (this._status){
                /**
                 * 当状态为pending时，将then方法回调函数加入执行队列等待执行
                 */
                case PENDING:
                    this._fulfilledQueues.push(fulfilled);
                    this._rejectedQueues.push(rejected);
                    break;
                /**
                 * 当状态已经改变时，立即执行对应的回调函数
                 */
                case FULFILLED:
                    fulfilled();
                    break;
                case REJECTED:
                    rejected();
                    break;
            }

        });

        return promise;
    }

    /**
     * 为实例添加catch方法，相当于调用then方法, 只传入rejected状态的回调函数
     * @param {Function} onRejected rejected状态的回调函数
     *
     */
    catch(onRejected){
        return this.then(undefined,onRejected);
    }

    /**
     * 添加静态resolve方法
     */

    static resolve (value){
        /**
         * 如果参数是MyPromise实例，直接返回这个实例
         */
        if(value instanceof MyPromise){
            return value;
        }

        return new MyPromise(resolve=>resolve(value));
    }

    /**
     * 添加静态reject方法
     */
    static reject(value){
        return new MyPromise((resolve,reject)=>{
            reject(value);
        });
    }

    /**
     * 添加静态all方法
     */
    static all(promises){
        return new MyPromise((resolve,reject)=>{
            /**
             * 返回值的集合
             */

            let values = [];

            for(let [i,p] of promises.entries()){
                /**
                 * 数组参数如果不是MyPromise实例，先调用MyPromise.resolve
                 */

                this.resolve(p).then(res=>{
                    console.log(i,res);
                    values[i]=res;// 按照参数数组的输入添加返回结果

                    /**
                     * 所有状态都变成fulfilled时返回的MyPromise状态就变成fulfilled
                     */
                    let removeEmpty = values.filter(val=>val);// 可能出现空位，可以利用filter跳过空位的特性
                    if(removeEmpty.length === promises.length){
                        resolve(values);
                    }
                },err=>{
                    /**
                     * 有一个被rejected时返回的MyPromise状态就变成rejected
                     */
                    reject(err);
                });
            }
        });
    }

    /**
     * 添加静态race方法
     */
    static rece (promises){
        return new MyPromise((resolve,reject)=>{
            for(let p of promises){
                /**
                 * 只要有一个实例率先改变状态，新的MyPromise的状态就跟着改变
                 */
                this.resolve(p).then(res=>{
                    resolve(res);
                },err=>{
                    reject(err);
                });
            }
        });
    }
}

// export default MyPromise;