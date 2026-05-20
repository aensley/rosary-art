import React, { Component } from 'react'
import NoSleep from './components/NoSleep'
import Rosary from './components/Rosary'
import CategoryList from './components/CategoryList'
import RosaryJumbotron from './components/RosaryJumbotron'
import Footer from './components/Footer'
import Slider from './components/Slider'

function getDefaultQuality() {
  const largest = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1)
  if (largest >= 3840) return 'q'
  if (largest >= 1920) return 'h'
  if (largest >= 1280) return 'i'
  return 'd'
}

export default class App extends Component {
  constructor(props) {
    super(props)
    this.rosary = new Rosary()
    this.today = this.rosary.getToday()
    this.handleOptionsChange = this.handleOptionsChange.bind(this)
    this.startSlider = this.startSlider.bind(this)
    this.stopSlider = this.stopSlider.bind(this)
    this.fullscreenChange = this.fullscreenChange.bind(this)
    this.stopListening = this.stopListening.bind(this)
    this.setSliderRef = this.setSliderRef.bind(this)
    this.state = {
      playing: false,
      indicators: true,
      season: '',
      category: this.rosary.getTodaysCategory(),
      categoryThumbs: this.rosary.getCategories(),
      mysteries: this.rosary.getMysteries(this.rosary.getTodaysCategory(), true, true, false),
      autohideCaptions: true,
      interval: false,
      options: {
        cycle: true,
        names: true,
        meditations: true,
        autohideCaptions: true,
        delay: 30,
        quality: getDefaultQuality()
      }
    }

    this.noSleep = new NoSleep()
    this.category = this.rosary.getTodaysCategory()
    this.fullscreenCounter = 0
  }

  componentDidMount() {
    const today = new Date().toLocaleDateString('en-CA')
    console.info('screen', screen.width, screen.height, window.devicePixelRatio, getDefaultQuality())
    fetch(`https://liturgy.day/api/rosary-days/${today}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })
      .then((response) => response.json())
      .then((response) => {
        let category = this.category
        for (var i in response['rosary-days']) {
          if (response['rosary-days'][i].indexOf(this.today) !== -1) {
            category = i
            break
          }
        }

        let season = response.season

        this.setState({
          mysteries: this.rosary.getMysteries(category, true, true, false),
          category: category,
          categoryThumbs: this.rosary.getCategories(response['rosary-days']).map((cat) => {
            const existing = this.state.categoryThumbs.find((t) => t.name === cat.name)
            return existing ? { ...cat, src: existing.src } : cat
          }),
          season: season
        })

        console.info('liturgy.day response', response)
      })
      .catch((err) => console.error(err))
  }

  setSliderRef(element) {
    this.sliderElement = element
  }

  startSlider(newMysteries) {
    this.noSleep.enable()
    const options = this.state.options
    this.setState({
      playing: true,
      mysteries: this.rosary.getMysteries(
        newMysteries,
        options.cycle,
        options.names,
        options.meditations,
        options.quality
      ),
      autohideCaptions: options.autohideCaptions,
      interval: options.cycle ? options.delay * 1000 : false,
      indicators: options.cycle
    })

    if (
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    ) {
      if (this.sliderElement.requestFullscreen) {
        this.sliderElement.requestFullscreen()
        document.onfullscreenchange = this.fullscreenChange
      } else if (this.sliderElement.webkitRequestFullscreen) {
        this.sliderElement.webkitRequestFullscreen()
        document.onwebkitfullscreenchange = this.fullscreenChange
      } else if (this.sliderElement.mozRequestFullScreen) {
        this.sliderElement.mozRequestFullScreen()
        document.onmozfullscreenchange = this.fullscreenChange
      } else if (this.sliderElement.msRequestFullscreen) {
        this.sliderElement.msRequestFullscreen()
        document.MSFullscreenChange = this.fullscreenChange
      }
    }
  }

  handleOptionsChange(newOptions) {
    this.setState({ options: newOptions })
  }

  stopSlider() {
    this.setState({
      playing: false,
      interval: false
    })
    this.noSleep.disable()
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }

  fullscreenChange() {
    this.fullscreenCounter++
    if (this.fullscreenCounter % 2 === 0) {
      this.stopSlider()
      this.stopListening()
    }
  }

  stopListening() {
    if (document.onfullscreenchange) {
      document.removeEventListener('onfullscreenchange', this.fullscreenChange)
    } else if (document.onwebkitfullscreenchange) {
      document.removeEventListener('onwebkitfullscreenchange', this.fullscreenChange)
    } else if (document.onmozfullscreenchange) {
      document.removeEventListener('onmozfullscreenchange', this.fullscreenChange)
    } else if (document.MSFullscreenChange) {
      document.removeEventListener('MSFullscreenChange', this.fullscreenChange)
    }
  }

  render() {
    return (
      <div>
        <main role="main">
          <RosaryJumbotron
            category={this.state.category}
            season={this.state.season}
            day={this.today}
            options={this.state.options}
            onOptionsChange={this.handleOptionsChange}
            launchAction={this.startSlider}
          />
          <CategoryList
            launchAction={this.startSlider}
            category={this.state.category}
            season={this.state.season}
            categoryThumbs={this.state.categoryThumbs}
          />
        </main>
        <Slider
          visible={this.state.playing}
          items={this.state.mysteries}
          indicators={this.state.indicators}
          autohideCaptions={this.state.autohideCaptions}
          interval={this.state.interval}
          onExit={this.stopSlider}
          sliderRef={this.setSliderRef}
        />
        <Footer />
      </div>
    )
  }
}
