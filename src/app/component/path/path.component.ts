import {Component, OnInit} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { AgmMap, MapsAPILoader } from '@agm/core';
import { Point } from 'src/app/classes/point';
import { PathPoint } from 'src/app/classes/pathPoint';
import { PathInfo } from 'src/app/classes/pathInfo';
import { POI } from 'src/app/classes/poi';
import { Bike } from 'src/app/classes/bike';
import { City } from 'src/app/classes/city';
import { Weather } from 'src/app/classes/weather';
import { Router } from '@angular/router';
import { Info } from 'src/app/classes/info';

@Component({
  selector: 'app-path',
  templateUrl: `./path.component.html`,
  styleUrls: ['../../../assets/styles/myStyle.scss']
})


export class PathComponent implements OnInit{
    latC = 0;
    lngC = 0;
    detailId: number | undefined;
    interests = ["Sustenance", "Education", "Entertainment", "Tourism", "Accomodation"]
    lists: any | undefined;
    listSelected= "path";
    pathInfo ="";
    cityToShow: number = 0;
    // @ts-ignore
    city : Array<City>; 
    pointOnMap : Array<Point> | undefined;
    pathPoints : Array<PathPoint> | undefined;
    pathList : Array<PathInfo> | undefined;
    data: any;
        

  constructor(private http: HttpClient,  private apiloader: MapsAPILoader, private router: Router) {
    this.data = this.router.getCurrentNavigation()?.extras.state;
  }

  async ngOnInit() {
    if(this.data == undefined){
      this.router.navigateByUrl("/pathSearch")
    }
    await this.parseInfo();
    this.lists = this.pathList;
  }

  updateCity(event: any){
    // @ts-ignore
    document.getElementById("detailedInfo").innerHTML = "";

    this.cityToShow = event.target.value;
    this.latC = this.city[this.cityToShow].lat;
    this.lngC = this.city[this.cityToShow].lng;
    
    if(this.listSelected == "poi"){
      if(this.city[this.cityToShow].poiList != undefined){
        this.lists = this.city[this.cityToShow].getPoiList();
        this.setPoiPoint();
      } else {
        this.listSelected = "path";
        this.lists = this.pathList;
      }
    }else if(this.listSelected  == "bike"){
      if(this.city[this.cityToShow].bikeList != undefined){
        this.lists = this.city[this.cityToShow].getBikeList();
        this.setBikePoint();
      } else {
        this.listSelected = "path";
        this.lists = this.pathList;
      }
    } else if(this.listSelected == "weather"){
      if(this.city[this.cityToShow].weatherList != undefined){
        this.lists = this.city[this.cityToShow].weatherList;
      } else {
        this.listSelected = "path";
        this.lists = this.pathList;
      }
    }
  }

  updateList(event: any){
    // @ts-ignore
    document.getElementById("detailedInfo").innerHTML = "";

    this.listSelected = event.target.value;
    this.pointOnMap = undefined;
    if(event.target.value == "path"){
        this.lists = this.pathList;
    } else if(event.target.value == "poi"){
        // @ts-ignore
        this.lists = this.city[this.cityToShow].poiList;
        this.setPoiPoint();
    } else if(event.target.value == "bike"){
        // @ts-ignore
        this.lists = this.city[this.cityToShow].bikeList;
        this.setBikePoint();
    } else if(event.target.value == "weather"){
        // @ts-ignore
        this.lists = this.city[this.cityToShow].weatherList;
    }
  }

  seeDetail(event:any){
    this.setDetailInfo(event.target.id);
  }

  showMarkerInfo(event: any){
    this.setDetailInfo(event._id);
  }

  setDetailInfo(id: number){
    let text = "";
    if(this.listSelected == "poi"){
        text = (this.getPOI(id))?.info;
    } else if(this.listSelected == "bike"){
        text = (this.getBike(id))?.info;
    }

    // @ts-ignore
    document.getElementById("detailedInfo").innerHTML = text;
  }

  setBikePoint(){
    // @ts-ignore
    let bikeList = (this.city[this.cityToShow]).getBikeList();
    let size = bikeList?.length;
    this.pointOnMap = new Array(size);
    // @ts-ignore
    for(let i = 0; i < size; i++){
        // @ts-ignore
        this.pointOnMap[i] = new Point(bikeList[i].id, bikeList[i].lat, bikeList[i].lng);
    }
  }

  setPoiPoint(){
    // @ts-ignore
    let poiList = (this.city[this.cityToShow]).getPoiList();
    let size = poiList?.length;
    this.pointOnMap = new Array(size);
    // @ts-ignore
    for(let i = 0; i < size; i++){
        // @ts-ignore
        this.pointOnMap[i] = new Point(poiList[i].id, poiList[i].lat, poiList[i].lng);
    }
  }

  getPOI(id: number){
    // @ts-ignore
    let poiList = (this.city[this.cityToShow]).getPoiList();
    // @ts-ignore
    for(let i = 0; i < poiList.length; i++){
        // @ts-ignore
        if(id == poiList[i].id){
            // @ts-ignore
            return poiList[i];
        }
    }
    return {info: ""};
  }

  getBike(id: number){
    // @ts-ignore
    let bikeList = (this.city[this.cityToShow]).getBikeList();
    // @ts-ignore
    for(let i = 0; i < bikeList.length; i++){
        // @ts-ignore
        if(id == bikeList[i].id){
            // @ts-ignore
            return bikeList[i];
        }
    }
    return {info: ""};
  }
  
  parseInfo(){
    console.log(this.data);
    this.parseRoute(this.data.paths[0]);
    this.latC = this.data.end.address.point.lat;
    this.lngC = this.data.end.address.point.lng;
    let numCity = this.data.intermediates.length;
    
    this.city = new Array(numCity + 2);
    this.parseCityValue(this.data.end, 0);
    for(let i = 0; i < numCity; i++){
        this.parseCityValue(this.data.intermediates[i], i+1);
    }
    this.parseCityValue(this.data.start, numCity+1);
    this.pointOnMap = undefined; 
  }

  parseCityValue(infoCity: any, index: number){
    let name = infoCity.address.name;
    let desc = this.parseCity(infoCity.address);
    this.city[index] = new City(name, desc, infoCity.address.point.lat, infoCity.address.point.lng);
    let size = 0;
    if(infoCity.poi != undefined && infoCity.poi.length > 0){ size++}
    if(infoCity.weather != undefined && infoCity.weather.length > 0){ size++}
    if(infoCity.bike != undefined && infoCity.bike.length > 0){ size++}
    this.city[index].options = new Array(size+1);
    this.city[index].options[0] = new Info("path", "Path");
    let i = 1;
    if(infoCity.poi != undefined && infoCity.poi.length > 0){
      this.city[index].poiList = this.parsePoi(infoCity.poi);
      this.lists = infoCity.poiList;
      this.setPoiPoint();
      this.city[index].options[i] = new Info("poi", "Point of interests");
      i++;
    }

    if(infoCity.weather != undefined){
      this.city[index].weatherList = this.parseWeather(infoCity.weather);
      this.city[index].options[i] = new Info("weather", "Weather");
      i++;
      if(this.lists == undefined){
        this.lists = this.city[index].weatherList;
      }
    }
    if(infoCity.bike != undefined){
      this.city[index].bikeList = this.parseBike(infoCity.bike);
      
      this.city[index].options[i] = new Info("bike", "Bike");
      i++;
      if(this.lists == undefined){
        this.lists = this.city[index].bikeList;
        this.setBikePoint();
      }
    }
  }

  parseCity(city: any){
    let text = city.name + " (" + city.countrycode + ")" + " is a " + city.osm_value + " located in " + city.state + "."
    if(city.postcode != undefined){
      text += "Its postcode is " + city.postcode + "."
    }

    if(city.point.lat != undefined){
      text += "Coordinate: " + city.point.lat + "; " + city.point.lng
    }
    return text;
  }

  parseWeather(weather: any){
    let date = new Date();
    let size = weather.forecasts.length;
    let weatherList = new Array(size + 1);
    let currentText = date.getDate() + "/" + (date.getMonth() + 1) + " " + weather.current;
    weatherList[0] = new Weather(0, currentText);
    let forecast = "";

    for(let i = 0; i < size; i++){
        date.setDate(date.getDate() + 1);
        forecast = date.getDate() + "/" + (date.getMonth() + 1) + " " + weather.forecasts[i];
        weatherList[i+1] = new Weather(i+1, forecast)
    }

    return weatherList;
  }

  parseBike(bike:any){
    let size = bike.length;
    let bikeList = new Array(size);
    let info = "";
    let desc = "";

    for(let i = 0; i < size; i++){
        info = bike[i].name + " of " + bike[i].company;
        desc = bike[i].name + " of " + bike[i].company + ".";
        desc += "<br>" + "Located in: " + bike[i].location.city + " (" + bike[i].location.country +")";
        desc += "<br>" + "Coordinate: " + bike[i].location.latitude + "; " + bike[i].location.longitude;
        bikeList[i] = new Bike(i, info, desc, bike[i].location.latitude, bike[i].location.longitude);
    }
    return bikeList;
  }

  parsePoi(poi: any){
    let size = poi.length;
    let poiList = new Array(size);
    let info = "";
    let desc = "";
    for(let i = 0; i < size; i++){
        info = poi[i].tags.name;
        desc = "<b>" + poi[i].tags.name + "</b>";
        if(poi[i].tags.amenity != undefined){
          info += ": " + poi[i].tags.amenity;
          desc += " is a " + poi[i].tags.amenity + ".";
        }
         
        if(poi[i].tags["addr:city"] != undefined){
          desc += "<br>It is located in " + poi[i].tags["addr:city"]
          if(poi[i].tags["addr:street"] != undefined){
            desc += ", " + poi[i].tags["addr:street"];

            if(poi[i].tags["addr:housenumber"] != undefined){
              desc += ", " + poi[i].tags["addr:housenumber"] + ".";
            }
          }
        } 
        
        if(poi[i].tags["contact:phone"] != undefined){
          desc += "<br>Contact: " + poi[i].tags["contact:phone"]; 
        }
        if(poi[i].tags["phone"] != undefined){
          desc += "<br>Contact: " + poi[i].tags["phone"]; 
        }
        if(poi[i].tags["email"] != undefined){
          desc += "<br>Contact: " + poi[i].tags["email"]; 
        }
        if(poi[i].tags["website"] != undefined){
          desc += "<br>Website: " + poi[i].tags["website"]; 
        }
        if(poi[i].lat != undefined){
          desc += "<br>Coordinates: " + poi[i].lat + "; " + poi[i].lon;
        }
        poiList[i] = new POI(i, info, desc, poi[i].lat, poi[i].lon);
    }

    return poiList;
  }

  parseRoute(routeObj: any){
    let text = "";
    text = "Distance: " + (routeObj.distance)/100 + " km. Time: " + (routeObj.time)/(1000*60) + " minutes"
    this.pathInfo = text;
    /*
    let minLng = routeObj.bbox[0];
    let minLat = routeObj.bbox[1];
    let maxLng = routeObj.bbox[2];
    let maxLat = routeObj.bbox[3];
    */
    let size = routeObj.points.coordinates.length;
    this.pathPoints = new Array(size) 
    for(let i = 0; i < size; i++){
        this.pathPoints[i] = new PathPoint(routeObj.points.coordinates[i][1], routeObj.points.coordinates[i][0])
    }
    let sizeInstructions = routeObj.instructions.length;
    this.pathList = new Array(sizeInstructions) 
    for(let i = 0; i < sizeInstructions; i++){
        this.pathList[i] = new PathInfo(i, routeObj.instructions[i].text + " for " + routeObj.instructions[i].distance + " meters (" + routeObj.instructions[i].time/1000 + " seconds)"); 
    }
  }
}