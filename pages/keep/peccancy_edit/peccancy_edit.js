var utils = require("../../../utils/util.js");
import Api from "../../../utils/api.js";
var app = getApp()

Page({
  data: {
    showFrameImage: false,
    initProviceData: '省份',
    initCityData: '城市',
    proviceIndex: 0,
    cityIndex: 0,
    proviceData: [],
    cityData: [],
    cityDisabled: true,
    carNumChange: '',
    proData: [],
    proText: '京',
    showProSelect: false,
    configIndex: 0,
    isVin: false,
    isCarCode: true,
    vinLength: 6,
    carCodeLength: 16,
    id:'',
    chepai:'',
    carcode:'',
    cardrivenumber:'',
  },
  onShow() {
    app.viewRecord();//活跃度统计
    this.loadConfig()
    this.queryData()
    this.setData({
      host: Api.config.host,
    })
  },
  //加载配置文件
  loadConfig() {
    var self = this;
    Api.authGet('/peccancy/region', {}, function (res) {
      self.setData({
        configData: res.data,
      })
      self.isVinOrCode();
      for (var i in res.data) {
        var proData = self.data.proData;
        proData.push(i)
        self.setData({
          proData: proData
        })
      }
    })
  },
  queryData(){
    var self = this;
    wx.getStorage({
      key: 'peccancyForm',
      success: function(res) {
        self.setData({
          isVin: false,
          isCarCode: false,
        })
        if (res.data.carcode){
          self.setData({
            isVin:true,
          })
        }
        if (res.data.cardrivenumber) {
          self.setData({
            isCarCode: true,
          })
        }
        self.setData({
          id:res.data.id,
          carNumChange: res.data.chepai.substring(1, res.data.chepai.length),
          proText: res.data.chepai.substring(1,0),
          carcode: res.data.carcode,
          cardrivenumber: res.data.cardrivenumber,
        })
      },
    })
  },
  //车牌输入控制
  inputCarNum(e) {
    //console.log(e.detail.value)
    var self = this;
    var carNum = e.detail.value.toUpperCase()
    if (!e.detail.value) {
      self.setData({
        carNumChange: ''
      })
    }
    //匹配中文的正则
    var exp = /[^\u4e00-\u9fa5]/;
    if (exp.test(carNum)) {
      //字母转换大写
      self.setData({
        carNumChange: carNum
      })
    } else {
      return
    }
    this.isVinOrCode()
  },
  //判断车架号或发动机号
  isVinOrCode() {
    var self = this;
    var configData = this.data.configData;
    var proText = this.data.proText;
    var cityCode = this.data.carNumChange.slice(0, 1);

    var headCode = configData[proText][proText + cityCode];
    var thisHeadCode = configData[proText][proText];
    var codeHead = proText + cityCode;

    self.setData({
      isVin: false,
      isCarCode: false,
    })
    if (headCode) {
      getValue(headCode)
    } else if (thisHeadCode) {
      getValue(thisHeadCode)
    } else {
      if (cityCode) {
        utils.toast('不支持当前城市')
      }
    }
    function getValue(obj) {
      if (obj.length == 0) {
        utils.toast('不支持当前城市')
        console.log(656)
        return
      }
      for (var i in obj) {

        if (obj[i].name == 'cardrivenumber') {
          var carCodeLengthText = '';
          if (obj[i].length < 17) {
            carCodeLengthText = '后' + obj[i].length + '位数'
          }
          self.setData({
            isCarCode: true,
            carCodeLength: obj[i].length,
            carCodeLengthText: carCodeLengthText
          })
        } else if (obj[i].name == 'carcode') {
          var vinLengthText = '';
          if (obj[i].length < 17) {
            vinLengthText = '后' + obj[i].length + '位数'
          }
          self.setData({
            isVin: true,
            vinLength: obj[i].length,
            vinLengthText: vinLengthText,
          })
        }

      }
    }
  },
  //车牌地tap
  changePro(e) {
    var proText = e.currentTarget.dataset.item
    var index = e.currentTarget.dataset.index
    this.setData({
      proText: proText,
      configIndex: index,
      showProSelect: false,
    })
    this.isVinOrCode()
  },
  //显示隐藏selectWrap
  selectPro() {
    var showProSelect = this.data.showProSelect;
    this.setData({
      showProSelect: !showProSelect
    })
  },
  //显示隐藏提示图片
  showImage() {
    var showFrameImage = this.data.showFrameImage
    this.setData({ showFrameImage: !showFrameImage });
  },
  //提交数据
  submitForm(e) {
    var self = this;
    var carNum = e.detail.value.carNum;
    var vinNum = e.detail.value.vinNum;
    var carCode = e.detail.value.carCode;
    if (!carNum) {
      utils.toast('请填写车牌')
    } else if (!utils.isVehicleNumber(self.data.proText + carNum)) {
      utils.toast('车牌错误')
    } else {
      var formData = { id:self.data.id ,chepai: self.data.proText + carNum }
      if (self.data.isVin) {
        formData.carcode = vinNum
      }
      if (self.data.isCarCode) {
        formData.cardrivenumber = carCode
      }
      wx.showLoading({
        title: '加载中...',
      })
      Api.authPost('/peccancy/edit-car', formData, function (res) {
        console.log(res)
        if (res.code == 200) {
          var id = res.data.id;
          wx.hideLoading()
          wx.setStorage({
            key: 'isReload',
            data: 'false',
          })
          wx.showToast({
            title: '修改成功！',
          })
          setTimeout(function () {
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }
      })



    }
  }
})
