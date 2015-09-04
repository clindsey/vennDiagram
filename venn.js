(function () {
  'use strict';

  var DiagramLegend = function ($el, dataA, dataB, overlapSet) {
    this.$el = $el;
    this.$el.addClass('dataset-legend');
    var $tableEl = $('<table>')
      , $tbodyEl = $('<tbody>')
      ;
    [
      {size: dataA.members.length, name: 'A - ' + dataA.title, setName: 'set-a'}
    , {size: dataB.members.length, name: 'B - ' + dataB.title, setName: 'set-b'}
    , {size: overlapSet.length, name: 'AB', setName: 'set-ab'}
    , {size: 0, name: 'Selected', setName: 'set-total'}
    ].forEach(function (data, index) {
      var $trEl = $('<tr>')
        , $colorTdEl = $('<td>')
        , $colorEl = $('<div>')
        , $labelEl = $('<td>')
        , $sizeEl = $('<td>')
        ;
      $trEl.addClass('set__row--' + data.setName);
      $colorEl.addClass('dataset-legend--color');
      $colorEl.addClass('dataset-legend--color__' + index);
      $colorTdEl.append($colorEl);
      $labelEl.html(data.name);
      $sizeEl.html(data.size);
      $trEl.append($colorTdEl, $labelEl, $sizeEl);
      $tbodyEl.append($trEl);
    });
    $tableEl.append($tbodyEl);
    this.$el.append($tableEl);
    this.$selectedSizeEl = this.$el.find('.set__row--set-total td:last-child');
  };

  DiagramLegend.prototype.setSelected = function (selectedSets, selectedSize) {
    this.$el.find('.set__row--selected').removeClass('set__row--selected');
    selectedSets.forEach(function (setName) {
      this.$el.find('.set__row--' + setName).addClass('set__row--selected');
    }.bind(this));
    this.$el.find('.set__row--set-total td:last-child').html(selectedSize);
    this.$selectedSizeEl.html(selectedSize);
  };

  $.fn.diagramLegend = function (optionsOrMethod) {
    if(typeof optionsOrMethod === 'string') {
      var method = optionsOrMethod
        , args = Array.prototype.slice.call(arguments, 1)
        , results = []
        ;
      this.each(function () {
        var diagramLegend = $(this).data('diagramLegend')
          ;
        results.push(diagramLegend[method].apply(diagramLegend, args));
      });
      return results.length > 1 ? results : results[0];
    } else {
      var options = optionsOrMethod
        , dataA = options.dataA
        , dataB = options.dataB
        , overlapSet = options.overlapSet
        ;
      return this.each(function () {
        var diagramLegend = new DiagramLegend($(this), dataA, dataB, overlapSet)
          ;
        $(this).data('diagramLegend', diagramLegend);
      });
    }
  };
})();

(function () {
  'use strict';

  var VennDiagram = function ($el, dataA, dataB, overlapSet) {
    this.$el = $el;
    this.$el.addClass('diagram-container');
    var setA = dataA.members
      , setB = dataB.members
      , minSetLength = Math.min(setA.length, setB.length)
      , maxSetLength = Math.max(setA.length, setB.length)
      , ratio = minSetLength / maxSetLength
      , width = this.$el.width() / 2
      , diameter = width * ratio
      , xPos = width / 2
      , xOffset = (width - diameter) / 2
      , leftCirclePos = xPos + xOffset
      , rightCirclePos = xPos + width
      , seperationDistance = rightCirclePos - leftCirclePos
      , leftCss
      , rightCss
      , positionDiff
      ;
    if(setA.length > setB.length) { // right circle is smaller
      positionDiff = seperationDistance * (overlapSet.length / setA.length);
      leftCss = this.drawCircle('set-a', width, leftCirclePos + (positionDiff / 2), dataA, overlapSet.length);
      rightCss = this.drawCircle('set-b', diameter, rightCirclePos + (0 - positionDiff / 2), dataB, overlapSet.length);
      rightCss.left -= leftCss.left - (width / 2);
      this.drawIntersection(leftCss, rightCss, overlapSet.length);
    } else { // left circle is smaller
      positionDiff = seperationDistance * (overlapSet.length / setB.length);
      leftCss = this.drawCircle('set-a', diameter, leftCirclePos + (positionDiff / 2), dataA, overlapSet.length);
      rightCss = this.drawCircle('set-b', width, rightCirclePos + (0 - positionDiff / 2), dataB, overlapSet.length);
      rightCss.left -= positionDiff / 2 + (width - diameter);
      this.drawIntersection(leftCss, rightCss, overlapSet.length);
    }
  };

  VennDiagram.prototype.drawCircle = function (setName, diameter, xPos, data, overlapSize) {
    var $containerEl = this.$el
      , $circleEl = $('<div>')
      , $outlineEl = $('<div>')
      , circleCss
      ;
    circleCss = {
      width: diameter
    , height: diameter
    , 'margin-left': 0 - diameter / 2
    , 'margin-top': 0 - diameter / 2
    , left: xPos
    };
    $circleEl.addClass('circle');
    $circleEl.addClass('circle--' + setName);
    $circleEl.css(circleCss);
    $circleEl.data({name: setName, size: data.members.length - overlapSize});
    $outlineEl.addClass('circle__outline');
    $outlineEl.addClass('circle__outline--' + setName);
    $outlineEl.css(circleCss);
    $containerEl.append($circleEl);
    $containerEl.append($outlineEl);
    return circleCss;
  };

  VennDiagram.prototype.drawIntersection = function (leftCss, rightCss, setSize) {
    var $containerEl = this.$el
      , $leftOverlapEl = $('<div>')
      , $rightOverlapEl = $('<div>')
      ;
    $leftOverlapEl.addClass('overlap');
    $leftOverlapEl.css(leftCss);
    $rightOverlapEl.addClass('overlap__inner');
    $rightOverlapEl.css(rightCss);
    $rightOverlapEl.data({name: 'set-ab', size: setSize});
    $leftOverlapEl.append($rightOverlapEl);
    $containerEl.append($leftOverlapEl);
  };

  VennDiagram.prototype.addEventListeners = function () {
    var overlapSize = this.$el.find('.overlap__inner').data('size')
      ;
    this.$el.on('click', '.circle, .overlap__inner', function (event) {
      var $el = $(event.currentTarget)
        ;
      $el.toggleClass('set--selected');
      if(this.$diagramLegendEl) {
        var selectedSets = []
          , selectedSize = 0
          , $selectedEls
          ;
        $selectedEls = this.$el.find('.set--selected');
        $selectedEls.each(function () {
          selectedSets.push($(this).data('name'));
          selectedSize += $(this).data('size');
        });
        if($selectedEls.length === 3) {
          selectedSize += overlapSize;
        }
        this.$diagramLegendEl.diagramLegend('setSelected', selectedSets, selectedSize);
      }
    }.bind(this));
  };

  VennDiagram.prototype.linkLegend = function ($diagramLegendEl) {
    this.$diagramLegendEl = $diagramLegendEl;
    this.addEventListeners();
  };

  $.fn.vennDiagram = function (optionsOrMethod) {
    if(typeof optionsOrMethod === 'string') {
      var method = optionsOrMethod
        , args = [].slice.call(arguments, 1)
        , results = []
        ;
      this.each(function () {
        var vennDiagram = $(this).data('vennDiagram')
          ;
        results.push(vennDiagram[method].apply(vennDiagram, args));
      });
      return results.length > 1 ? results : results[0];
    } else {
      var options = optionsOrMethod
        , dataA = options.dataA
        , dataB = options.dataB
        , overlapSet = options.overlapSet
        ;
      return this.each(function () {
        var vennDiagram = new VennDiagram($(this), dataA, dataB, overlapSet)
          ;
        $(this).data('vennDiagram', vennDiagram);
      });
    }
  };
})();
